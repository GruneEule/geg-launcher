"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import type { ModLoader } from "../../../types/profile";
import { Modal } from "../../ui/Modal";
import { Button } from "../../ui/buttons/Button";
import { StatusMessage } from "../../ui/StatusMessage";
import { useThemeStore } from "../../../store/useThemeStore";
import { Input } from "../../ui/Input";
import { RangeSlider } from "../../ui/RangeSlider";
// NoRisk Client selection removed

// NoRisk Client pack types removed

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
        selectedNoriskPackId: string | null;
    }) => void;
    selectedMinecraftVersion: string;
    selectedLoader: ModLoader;
    selectedLoaderVersion: string | null;
}

export function ProfileWizardV2Step3({
    onClose,
    onBack,
    onCreate,
    selectedMinecraftVersion,
    selectedLoader,
    selectedLoaderVersion
}: ProfileWizardV2Step3Props) {
    const accentColor = useThemeStore((state) => state.accentColor);
    const [profileName, setProfileName] = useState("");
    const [profileGroup, setProfileGroup] = useState("");
    const [memoryMaxMb, setMemoryMaxMb] = useState<number>(3072); // 3GB default
    const [systemRamMb] = useState<number>(16384); // 16GB default for slider range
    // NoRisk Client related state removed
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // NoRisk pack loading removed

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

    // NoRisk pack options removed

    // NoRisk pack compatibility checks removed

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
                selectedNoriskPackId: null
            });
        } catch (err) {
            console.error("Failed to create profile:", err);
            setError(`Failed to create profile: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setCreating(false);
        }
    };



    const renderContent = () => {
        if (error) {
            return <StatusMessage type="error" message={error} />;
        }

        return (
            <div className="space-y-8">
                {/* Profile Details */}
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Profile Name"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        placeholder="Enter profile name..."
                        size="md"
                        className="w-full"
                        required
                    />

                    <Input
                        label="Group (Optional)"
                        value={profileGroup}
                        onChange={(e) => setProfileGroup(e.target.value)}
                        placeholder="Enter group name..."
                        size="md"
                        className="w-full"
                    />
                </div>

                {/* RAM Settings */}
                <div className="space-y-3">
                    <label className="block text-base font-minecraft-ten text-white/50">
                        Recommended RAM: 3072 mb
                    </label>
                    <RangeSlider
                        value={memoryMaxMb}
                        onChange={handleMemoryChange}
                        min={1024}
                        max={systemRamMb}
                        step={512}
                        minLabel="1 GB"
                        maxLabel={`${(systemRamMb / 1024).toFixed(1)} GB`}
                    />
                </div>

                {/* NoRisk Client pack selection removed */}
            </div>
        );
    };

    const renderFooter = () => (
        <div className="flex justify-between">
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
                disabled={creating || !profileName.trim()}
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