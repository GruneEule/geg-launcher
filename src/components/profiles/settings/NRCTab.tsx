"use client";

import { useEffect, useRef, useState } from "react";
import type { Profile } from "../../../types/profile";
import { invoke } from "@tauri-apps/api/core";
import { Icon } from "@iconify/react";
import { useThemeStore } from "../../../store/useThemeStore";
import { CustomDropdown } from "../../ui/CustomDropdown";
import { Checkbox } from "../../ui/Checkbox";
import { Button } from "../../ui/buttons/Button";
import { gsap } from "gsap";
import { toast } from "react-hot-toast";
import * as ProfileService from "../../../services/profile-service";

interface NoriskPack {
  displayName: string;
  description: string;
  isExperimental?: boolean;
}

interface NRCTabProps {
  profile: Profile;
  editedProfile: Profile;
  updateProfile: (updates: Partial<Profile>) => void;
  onRefresh?: () => Promise<Profile>;
}

export function NRCTab({
  profile,
  editedProfile,
  updateProfile,
  onRefresh,
}: NRCTabProps) {
  const [noriskPacks, setNoriskPacks] = useState<Record<string, NoriskPack>>({});
  const [loading, setLoading] = useState(false);
  const [packCompatibilityWarning, setPackCompatibilityWarning] = useState<string | null>(null);
  const [showYellowWarning, setShowYellowWarning] = useState(false);
  const [checkingCompatibility, setCheckingCompatibility] = useState(false);
  const [showAllVersions, setShowAllVersions] = useState(false); // Default to false to show only curated versions
  const [isRepairing, setIsRepairing] = useState(false);
  const accentColor = useThemeStore((state) => state.accentColor);
  const isBackgroundAnimationEnabled = useThemeStore(
    (state) => state.isBackgroundAnimationEnabled,
  );
  const tabRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isBackgroundAnimationEnabled && tabRef.current) {
      gsap.fromTo(
        tabRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.4, ease: "power2.out" },
      );
    }
  }, [isBackgroundAnimationEnabled]);

  // Load NoRisk packs on component mount
  useEffect(() => {
    const loadNoriskPacks = async () => {
      try {
        setLoading(true);
        const packsData = await invoke<{ packs: Record<string, NoriskPack> }>(
          "get_norisk_packs_resolved",
        ).catch(() => ({
          packs: {},
        }));
        console.log("PACKS", packsData);
        setNoriskPacks(packsData.packs);
      } catch (err) {
        console.error("Failed to load NoRisk packs:", err);
      } finally {
        setLoading(false);
      }
    };

    loadNoriskPacks();
  }, []);

  const noriskPackOptions = Object.entries(noriskPacks)
    .filter(([packId]) => {
      if (showAllVersions) return true; // Show all versions when checkbox is checked
      // Show only curated versions when checkbox is unchecked
      return packId === "norisk-prod" || packId === "norisk-bughunter" || packId === "";
    })
    .map(([packId, packDef]) => ({
      value: packId,
      label: `${packDef.displayName} ${packDef.isExperimental ? "(experimental)" : ""}`,
    }));

  // Check pack compatibility when selection changes
  useEffect(() => {
    const checkPackCompatibility = async () => {
      if (!editedProfile.selected_norisk_pack_id || editedProfile.selected_norisk_pack_id === "") {
        setPackCompatibilityWarning(null);
        setShowYellowWarning(false);
        return;
      }

      setCheckingCompatibility(true);
      setPackCompatibilityWarning(null);
      setShowYellowWarning(false);

      try {
        // Get resolved packs with all mods
        const resolvedPacks = await invoke<{ packs: Record<string, NoriskPack> }>(
          "get_norisk_packs_resolved"
        );

        // Check if the selected pack has NoRisk Client mods
        if (!resolvedPacks.packs[editedProfile.selected_norisk_pack_id]) {
          setShowYellowWarning(true);
          return;
        }
      } catch (err) {
        console.warn("Failed to check pack compatibility:", err);
        setShowYellowWarning(true);
      } finally {
        setCheckingCompatibility(false);
      }
    };

    checkPackCompatibility();
  }, [editedProfile.selected_norisk_pack_id]);

  const handleRepair = async () => {
    try {
      setIsRepairing(true);
      await ProfileService.repairProfile(profile.id);
      toast.success("Profile repair completed successfully!");
    } catch (err) {
      console.error("Failed to repair profile:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      toast.error(`Failed to repair profile: ${errorMessage}`);
    } finally {
      setIsRepairing(false);
    }
  };

  return (
    <div ref={tabRef} className="space-y-6 select-none">
      <div className="space-y-6">




        {/* Repair Profile Section */}
        <div className="space-y-3">
          <label className="block text-3xl font-minecraft text-white mb-2 lowercase">
            repair profile
          </label>
          <div className="flex flex-col space-y-2 max-w-xs">
            <p className="text-xs text-white/60 font-minecraft-ten select-none leading-relaxed whitespace-normal break-words overflow-wrap-anywhere">
              Repairs the profile installation by redownloading missing or corrupted files.
            </p>
            <Button
              onClick={handleRepair}
              disabled={isRepairing}
              variant="secondary"
              icon={
                isRepairing ? (
                  <Icon
                    icon="solar:refresh-bold"
                    className="w-4 h-4 animate-spin text-white"
                  />
                ) : (
                  <Icon icon="solar:shield-check-bold" className="w-4 h-4 text-white" />
                )
              }
              size="sm"
              className="text-xl"
            >
              {isRepairing ? "repairing..." : "repair"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
