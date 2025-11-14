"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import type { ModLoader } from "../../../types/profile";
import { Modal } from "../../ui/Modal";
import { Button } from "../../ui/buttons/Button";
import { StatusMessage } from "../../ui/StatusMessage";
import { useThemeStore } from "../../../store/useThemeStore";
import { SearchStyleInput } from "../../ui/Input";
import { RangeSlider } from "../../ui/RangeSlider";
import { Select } from "../../ui/Select";
import { Card } from "../../ui/Card";
import { Checkbox } from "../../ui/Checkbox";
import { invoke } from "@tauri-apps/api/core";
import { GEGModEntryDefinition, GEGModpacksConfig } from "../../../types/GEGPacks";

const forbiddenChars = /[<>:"/\\|?*]/g;
const forbiddenTrailing = /[ .]$/;

interface GEGPack {
    displayName: string;
    description: string;
    isExperimental?: boolean;
}

interface ProfileWizardV2Step3Props {
    onClose: () => void;
    onBack: () => void;
    onCreate: (profileData: {
        name: string;
        group: string | null;
        minecraftVersion: string;
        loader: ModLoader;
        loaderVersion: string | null;
        memoryMaxMb: number;
        selectedGEGPackId: string | null;
        use_shared_minecraft_folder?: boolean;
    }) => void;
    selectedMinecraftVersion: string;
    selectedLoader: ModLoader;
    selectedLoaderVersion: string | null;
    defaultGroup?: string | null;
}

export function ProfileWizardV2Step3({
    onClose,
    onBack,
    onCreate,
    selectedMinecraftVersion,
    selectedLoader,
    selectedLoaderVersion,
    defaultGroup
}: ProfileWizardV2Step3Props) {
    const accentColor = useThemeStore((state) => state.accentColor);
    const [profileName, setProfileName] = useState("");
    const [profileGroup, setProfileGroup] = useState(defaultGroup || "");
    const [memoryMaxMb, setMemoryMaxMb] = useState<number>(3072); // 3GB default
    const [systemRamMb] = useState<number>(16384); // 16GB default for slider range
    const [selectedGEGPackId, setSelectedGEGPackId] = useState<string | null>(null);
    const [GEGPacks, setGEGPacks] = useState<Record<string, GEGPack>>({});
    const [loadingPacks, setLoadingPacks] = useState(false);
    const [packCompatibilityWarning, setPackCompatibilityWarning] = useState<string | null>(null);
    const [showYellowWarning, setShowYellowWarning] = useState(false);
    const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
    const [useSharedMinecraftFolder, setUseSharedMinecraftFolder] = useState(
        defaultGroup && defaultGroup.toLowerCase() !== "modpacks"
    ); // Default to true when group exists and is not "modpacks"
    const [showAllVersions, setShowAllVersions] = useState(false); // Default to false to show only curated versions

    // Update profile group when defaultGroup changes
    useEffect(() => {
        if (defaultGroup && !profileGroup) {
            setProfileGroup(defaultGroup);
        }
    }, [defaultGroup]);

    // Update shared Minecraft folder setting when defaultGroup changes
    useEffect(() => {
        setUseSharedMinecraftFolder(
            defaultGroup && defaultGroup.toLowerCase() !== "modpacks"
        );
    }, [defaultGroup]);

    const [checkingCompatibility, setCheckingCompatibility] = useState(false);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load GEG packs on component mount
    useEffect(() => {
        const loadGEGPacks = async () => {
            try {
                setLoadingPacks(true);
                const packsData = await invoke<{ packs: Record<string, GEGPack> }>(
                    "get_GEG_packs_resolved",
                ).catch(() => ({
                    packs: {},
                }));
                console.log("PACKS", packsData);
                setGEGPacks(packsData.packs);

                // Auto-select "GEG-prod" if available
                if (packsData.packs["GEG-prod"]) {
                    setSelectedGEGPackId("GEG-prod");
                }
            } catch (err) {
                console.error("Failed to load GEG packs:", err);
            } finally {
                setLoadingPacks(false);
            }
        };

        loadGEGPacks();
    }, []);

    const getLoaderDisplayName = (loader: ModLoader) => {
        const names = {
            vanilla: "Vanilla",
            fabric: "Fabric",
            forge: "Forge",
            neoforge: "NeoForge",
            quilt: "Quilt"
        };
        return names[loader] || loader;
    };

    const handleMemoryChange = (value: number) => {
        setMemoryMaxMb(value);
    };

    const GEGPackOptions = Object.entries(GEGPacks)
        .filter(([packId]) => {
            if (showAllVersions) return true; // Show all versions when checkbox is checked
            // Show only curated versions when checkbox is unchecked
            return packId === "GEG-prod" || packId === "GEG-bughunter" || packId === "";
        })
        .map(([packId, packDef]) => ({
            value: packId,
            label: `${packDef.displayName} ${packDef.isExperimental ? "(experimental)" : ""}`,
        }));

    // Check pack compatibility when selection changes
    useEffect(() => {
        const checkPackCompatibility = async () => {
            if (!selectedGEGPackId || selectedGEGPackId === "") {
                setPackCompatibilityWarning(null);
                setShowYellowWarning(false);
                return;
            }

            setCheckingCompatibility(true);
            setPackCompatibilityWarning(null);
            setShowYellowWarning(false);

            try {
                // Get resolved packs with all mods
                const resolvedPacks = await invoke<GEGModpacksConfig>(
                    "get_GEG_packs_resolved"
                );

                // Check if the selected pack has GEG Client mods for this version/loader
                const selectedPack = resolvedPacks.packs[selectedGEGPackId];

                if (!selectedPack) {
                    setShowYellowWarning(true);
                    return;
                }

                // Get the mods in the pack
                const mods = selectedPack.mods || [];

                // Check if any GEG Client mod exists and is compatible with the selected version/loader
                const hasCompatibleGEG = mods.some((mod: GEGModEntryDefinition) => {
                    // Check if this is a GEG Client mod
                    if (mod.id === "GEG-client" || mod.id === "nrc-client") {
                        // Check if it has compatibility for the selected version and loader
                        const versionCompat = mod.compatibility?.[selectedMinecraftVersion];
                        const loaderCompat = versionCompat?.[selectedLoader];
                        console.log(`Checking mod ${mod.id} compatibility:`, {
                            version: selectedMinecraftVersion,
                            loader: selectedLoader,
                            versionCompat,
                            loaderCompat,
                            hasCompat: !!loaderCompat
                        });
                        return !!loaderCompat; // Returns true if compatibility exists
                    }
                    return false;
                });

                console.log("Pack mods for", selectedGEGPackId, selectedMinecraftVersion, selectedLoader, ":", mods);
                console.log("Has compatible GEG Client:", hasCompatibleGEG);

                if (!hasCompatibleGEG) {
                    setShowYellowWarning(true);
                }
            } catch (err) {
                console.warn("Failed to check pack compatibility:", err);
                setShowYellowWarning(true);
            } finally {
                setCheckingCompatibility(false);
            }
        };

        checkPackCompatibility();
    }, [selectedGEGPackId, selectedMinecraftVersion, selectedLoader]);

    // Auto-generate profile name based on loader and minecraft version
    useEffect(() => {
        const generateProfileName = () => {
            const loaderName = getLoaderDisplayName(selectedLoader);
            return `${loaderName} ${selectedMinecraftVersion}`;
        };

        setProfileName(generateProfileName());
    }, [selectedLoader, selectedMinecraftVersion]);

    const handleCreate = async () => {
        if (!profileName.trim()) {
            setError("Profile name is required");
            return;
        }

        setCreating(true);
        setError(null);

        try {
            await onCreate({
                name: profileName.trim(),
                group: profileGroup.trim() || null,
                minecraftVersion: selectedMinecraftVersion,
                loader: selectedLoader,
                loaderVersion: selectedLoaderVersion,
                memoryMaxMb: memoryMaxMb,
                selectedGEGPackId: selectedGEGPackId,
                use_shared_minecraft_folder: useSharedMinecraftFolder
            });
        } catch (err) {
            console.error("Failed to create profile:", err);
            setError(`Failed to create profile: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setCreating(false);
        }
    };

    // ProfileName ForbiddenCharacter Event Handler
    const [profileCharRemoved, setProfileCharRemoved] = useState(false);
    const [profileNameHasForbiddenEnding, setProfileNameHasForbiddenEnding] = useState(false);

    const handleProfileNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const cleanValue = value.replace(forbiddenChars, "");

        if (value !== cleanValue) {
            setProfileCharRemoved(true);
        }

        setProfileNameHasForbiddenEnding(forbiddenTrailing.test(cleanValue));

        setProfileName(cleanValue);
    };

    const renderContent = () => {
        if (error) {
            return <StatusMessage type="error" message={error} />;
        }

        return (
            <div className="space-y-8">
                {/* Profile Details */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="block text-base font-minecraft-ten text-white/50">
                            Profile Name
                        </label>
                        <SearchStyleInput
                            value={profileName}
                            onChange={handleProfileNameChange}
                            placeholder="Enter profile name..."
                            required
                        />
                        {profileCharRemoved && (
                            <p className="text-xs text-red-400 font-minecraft-ten mt-1">
                                The profile name cannot contain these characters: &lt; &gt; : " / \ | ? *
                            </p>
                        )}
                        {profileNameHasForbiddenEnding && (
                            <p className="text-xs text-red-400 font-minecraft-ten mt-1">
                                The profile name cannot end with a space or dot.
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="block text-base font-minecraft-ten text-white/50">
                            Group (Optional)
                        </label>
                        <SearchStyleInput
                            value={profileGroup}
                            onChange={(e) => setProfileGroup(e.target.value)}
                            placeholder="Enter group name..."
                        />
                    </div>
                </div>

                {/* Checkbox Options */}
                <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-1">
                        <Checkbox
                            label="Use shared Minecraft folder"
                            checked={useSharedMinecraftFolder}
                            onChange={(event) => setUseSharedMinecraftFolder(event.target.checked)}
                            description="When enabled, a shared Minecraft folder will be used based on the group. Your settings, worlds, configs and resource packs will remain the same between profiles."
                            descriptionClassName="font-minecraft-ten text-sm"
                            size="lg"
                        />
                        <p className="text-xs text-white/50 font-minecraft-ten ml-10 -mt-1">
                            (you can change this anytime)
                        </p>
                    </div>
                </div>

                {/* RAM Settings */}
                <div className="space-y-3">
                    <label className="block text-base font-minecraft-ten text-white/50">
                        Recommended RAM: 4096 mb
                    </label>
                    <RangeSlider
                        value={memoryMaxMb}
                        onChange={handleMemoryChange}
                        min={1024}
                        max={systemRamMb}
                        step={512}
                        valueLabel={`${memoryMaxMb} MB (${(memoryMaxMb / 1024).toFixed(1)} GB)`}
                        minLabel="1 GB"
                        maxLabel={`${systemRamMb} MB`}
                        variant="flat"
                        recommendedRange={[4096, 8192]}
                        unit="MB"
                    />
                </div>

                {/* Advanced Settings */}
                <div className="space-y-3">
                    <button
                        onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                        className="flex items-center justify-between w-full p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <span className="text-base font-minecraft-ten text-white/80">
                            Advanced Settings
                        </span>
                        <Icon
                            icon={showAdvancedSettings ? "solar:chevron-up-bold" : "solar:chevron-down-bold"}
                            className="w-5 h-5 text-white/60"
                        />
                    </button>

                    {showAdvancedSettings && (
                        <div className="space-y-4 p-4 bg-white/5 border border-white/10 rounded-lg">
                            {/* GEG Pack Selection */}
                            <div className="space-y-3">
                                <label className="block text-base font-minecraft-ten text-white/50">
                                    GEG Client Pack
                                </label>
                                <p className="text-sm text-white/60 font-minecraft-ten">
                                    GEG packs are predefined mod collections from GEG, including performance mods like Sodium, Fabric API, ImmediatelyFast, and mods for seamless GEG experience. You can disable this to start without GEG features.
                                </p>
                                {loadingPacks ? (
                                    <div className="flex items-center gap-2 text-white/70">
                                        <Icon
                                            icon="solar:refresh-bold"
                                            className="w-4 h-4 animate-spin"
                                        />
                                        <span className="text-sm font-minecraft-ten">
                                            Loading GEG packs...
                                        </span>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex gap-3">
                                            <div className="flex-1">
                                                <Select
                                                    value={selectedGEGPackId || ""}
                                                    onChange={(value) => setSelectedGEGPackId(value === "" ? null : value)}
                                                    options={[
                                                        { value: "", label: "None (Optional)" },
                                                        ...GEGPackOptions,
                                                    ]}
                                                    placeholder="Select a GEG pack..."
                                                    size="md"
                                                    className="w-full"
                                                />
                                            </div>
                                            <div className="flex items-center">
                                                <Checkbox
                                                    checked={showAllVersions}
                                                    onChange={(event) => setShowAllVersions(event.target.checked)}
                                                    label="Show all versions"
                                                    size="sm"
                                                    className="text-white/70"
                                                />
                                            </div>
                                        </div>
                                        {/* Show either warning, none hint, or description */}
                                        {showYellowWarning ? (
                                            <div className="text-center">
                                                <p className="text-base text-yellow-400 font-minecraft-ten">
                                                    GEG is not currently compatible with this loader or version!<br />
                                                    You can still create it, but you won't have the features.<br />
                                                    This may change in the future.
                                                </p>
                                            </div>
                                        ) : selectedGEGPackId === null || selectedGEGPackId === "" ? (
                                            <div className="text-center">
                                                <p className="text-sm text-amber-400 font-minecraft-ten">
                                                    You won't have any GEG features with this selection.
                                                </p>
                                            </div>
                                        ) : (
                                            selectedGEGPackId && GEGPacks[selectedGEGPackId] && (
                                                <div className="text-center">
                                                    <p className="text-sm text-white/70 font-minecraft-ten">
                                                        {GEGPacks[selectedGEGPackId].description}
                                                    </p>
                                                </div>
                                            )
                                        )}

                                        {/* Compatibility Checking */}
                                        {checkingCompatibility && (
                                            <div className="flex items-center gap-2 text-white/70">
                                                <Icon
                                                    icon="solar:refresh-bold"
                                                    className="w-4 h-4 animate-spin"
                                                />
                                                <span className="text-sm font-minecraft-ten">
                                                    Checking compatibility...
                                                </span>
                                            </div>
                                        )}

                                        {/* Compatibility Warning */}
                                        {packCompatibilityWarning && (
                                            <Card
                                                variant="flat"
                                                className="p-3 bg-red-900/20 border border-red-500/30"
                                            >
                                                <div className="flex items-start gap-2">
                                                    <Icon
                                                        icon="solar:danger-triangle-bold"
                                                        className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5"
                                                    />
                                                    <p className="text-xs text-red-300 font-minecraft-ten">
                                                        {packCompatibilityWarning}
                                                    </p>
                                                </div>
                                            </Card>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderFooter = () => (
        <div className="flex justify-between items-center">
            <Button
                variant="secondary"
                onClick={onBack}
                disabled={creating}
                size="md"
                className="text-xl"
                icon={<Icon icon="solar:arrow-left-bold" className="w-5 h-5" />}
                iconPosition="left"
            >
                back
            </Button>

            <Button
                variant="success"
                onClick={handleCreate}
                disabled={
                    creating ||
                    !profileName.trim() ||
                    profileNameHasForbiddenEnding
                }
                size="md"
                className="min-w-[180px] text-xl"
                icon={
                    creating ? (
                        <Icon icon="solar:refresh-bold" className="w-5 h-5 animate-spin" />
                    ) : (
                        <Icon icon="solar:check-circle-bold" className="w-5 h-5" />
                    )
                }
                iconPosition="left"
            >
                {creating ? "creating..." : "create profile"}
            </Button>
        </div>
    );

    return (
        <Modal
            title="create profile - finalize"
            onClose={onClose}
            width="lg"
            footer={renderFooter()}
        >
            <div className="min-h-[500px] p-6 overflow-hidden">
                {renderContent()}
            </div>
        </Modal>
    );
}
