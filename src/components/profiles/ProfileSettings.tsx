"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { gsap } from "gsap";
import type { Profile } from "../../types/profile";
import { GeneralSettingsTab } from "./settings/GeneralSettingsTab";
import { InstallationSettingsTab } from "./settings/InstallationSettingsTab";
import { JavaSettingsTab } from "./settings/JavaSettingsTab";
import { WindowSettingsTab } from "./settings/WindowSettingsTab";
import { NRCTab } from "./settings/NRCTab";

import { useProfileStore } from "../../store/profile-store";
import * as ProfileService from "../../services/profile-service";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/buttons/Button";
import { useThemeStore } from "../../store/useThemeStore";
import { toast } from "react-hot-toast";
import { useFlags } from 'flagsmith/react';
import { DesignerSettingsTab } from './settings/DesignerSettingsTab';
import { cn } from "../../lib/utils";

interface ProfileSettingsProps {
  profile: Profile;
  onClose: () => void;
}

type SettingsTab =
  | "general"
  | "installation"
  | "java"
  | "window"
  | "designer";

const DESIGNER_FEATURE_FLAG_NAME = "show_keep_local_assets";

export function ProfileSettings({ profile, onClose }: ProfileSettingsProps) {
  const { updateProfile, deleteProfile } = useProfileStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [editedProfile, setEditedProfile] = useState<Profile>({ ...profile });
  const [currentProfile, setCurrentProfile] = useState<Profile>({ ...profile });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [systemRam, setSystemRam] = useState<number>(8192);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const { accentColor } = useThemeStore();
  const isBackgroundAnimationEnabled = useThemeStore(
    (state) => state.isBackgroundAnimationEnabled,
  );

  const flags = useFlags([DESIGNER_FEATURE_FLAG_NAME]);
  const showDesignerTab = flags[DESIGNER_FEATURE_FLAG_NAME]?.enabled === true;
  const [tempRamMb, setTempRamMb] = useState(profile.settings?.memory?.max ?? 3072);

  useEffect(() => {
    ProfileService.getSystemRamMb()
      .then((ram) => setSystemRam(ram))
      .catch((err) => {
        console.error("Failed to get system RAM:", err);
      });
  }, []);

  useEffect(() => {
    if (isBackgroundAnimationEnabled && contentRef.current) {
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" },
      );
    }
  }, [activeTab, isBackgroundAnimationEnabled]);

  useEffect(() => {
    if (isBackgroundAnimationEnabled && sidebarRef.current) {
      gsap.fromTo(
        sidebarRef.current,
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" },
      );
    }
  }, [isBackgroundAnimationEnabled]);

  useEffect(() => {
    setTempRamMb(profile.settings?.memory?.max ?? 3072);
  }, [profile]);

  const updateProfileData = (updates: Partial<Profile>) => {
    setEditedProfile((prev) => ({ ...prev, ...updates }));
  };

  const handleRefresh = async () => {
    try {
      const updatedProfile = await ProfileService.getProfile(profile.id);
      setCurrentProfile(updatedProfile);
      setEditedProfile(updatedProfile);
      
      // Update the global store as well to sync with ProfilesTab
      useProfileStore.getState().refreshSingleProfileInStore(updatedProfile);
      
      return updatedProfile;
    } catch (error) {
      console.error("Failed to refresh profile:", error);
      throw error;
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await updateProfile(profile.id, {
        name: editedProfile.name,
        game_version: editedProfile.game_version,
        loader: editedProfile.loader,
        loader_version: editedProfile.loader_version || null || undefined,
        settings: {
          ...editedProfile.settings,
          memory: {
            ...editedProfile.settings?.memory,
            max: tempRamMb,
          },
        },
        selected_norisk_pack_id: editedProfile.selected_norisk_pack_id,
        clear_selected_norisk_pack: !editedProfile.selected_norisk_pack_id,
        group: editedProfile.group,
        clear_group: !editedProfile.group,
        description: editedProfile.description,
        norisk_information: editedProfile.norisk_information,
      });

      toast.success("Profile saved successfully!");
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error("Failed to save profile:", err);
      toast.error("Failed to save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const deletePromise = deleteProfile(profile.id);

      toast
        .promise(deletePromise, {
          loading: `Deleting profile '${profile.name}'...`,
          success: () => {
            onClose();
            return `Profile '${profile.name}' deleted successfully!`;
          },
          error: (err) => {
            const errorMessage =
              err instanceof Error ? err.message : String(err.message);
            return `Failed to delete profile: ${errorMessage}`;
          },
        })
        .finally(() => {
          setIsDeleting(false);
        });
    } catch (err) {
      console.error("Error during delete initiation:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      toast.error(`Failed to initiate profile deletion: ${errorMessage}`);
      setIsDeleting(false);
    }
  };

  const baseTabConfig = [
    { id: "general", label: "General", icon: "solar:settings-bold" },
    { id: "installation", label: "Installation", icon: "solar:download-bold" },
    { id: "java", label: "JAVA & Memory", icon: "solar:code-bold" },
    { id: "window", label: "Window", icon: "solar:widget-bold" },
  ];

  const tabConfig = showDesignerTab
    ? [
        ...baseTabConfig,
        { id: "designer", label: "Designer", icon: "solar:palette-bold" },
      ]
    : baseTabConfig;

  useEffect(() => {
    if (activeTab === "designer" && !showDesignerTab) {
      setActiveTab("general");
    }
  }, [activeTab, showDesignerTab]);

  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return (
          <GeneralSettingsTab
            profile={currentProfile}
            editedProfile={editedProfile}
            updateProfile={updateProfileData}
            onDelete={handleDelete}
            isDeleting={isDeleting}
            onRefresh={handleRefresh}
          />
        );
      case "installation":
        return (
          <InstallationSettingsTab
            profile={profile}
            editedProfile={editedProfile}
            updateProfile={updateProfileData}
            refreshTrigger={refreshTrigger}
          />
        );
      case "java":
        return (
          <JavaSettingsTab
            editedProfile={editedProfile}
            updateProfile={updateProfileData}
            systemRam={systemRam}
            tempRamMb={tempRamMb}
            setTempRamMb={setTempRamMb}
          />
        );
      case "window":
        return (
          <WindowSettingsTab
            editedProfile={editedProfile}
            updateProfile={updateProfileData}
          />
        );
      case "designer":
        if (showDesignerTab) {
          return (
            <DesignerSettingsTab
              editedProfile={editedProfile}
              updateProfile={updateProfileData}
            />
          );
        }
        return null;
      default:
        return null;
    }
  };

  const renderFooter = () => (
    <div className="flex justify-between">
      <Button
        variant="secondary"
        onClick={onClose}
        size="md"
        className="text-2xl"
      >
        cancel
      </Button>
      <Button
        variant="default"
        onClick={handleSave}
        disabled={isSaving}
        size="md"
        className="text-2xl"
      >
        {isSaving ? (
          <div className="flex items-center gap-3">
            <Icon
              icon="solar:refresh-bold"
              className="w-6 h-6 animate-spin text-white"
            />
            <span>saving...</span>
          </div>
        ) : (
          "save changes"
        )}
      </Button>
    </div>
  );

  const handleTabClick = (tabId: string) => {
    if (activeTab !== tabId) {
      if (isBackgroundAnimationEnabled && contentRef.current) {
        gsap.to(contentRef.current, {
          opacity: 0,
          y: 20,
          duration: 0.2,
          ease: "power2.in",
          onComplete: () => setActiveTab(tabId as SettingsTab),
        });
      } else {
        setActiveTab(tabId as SettingsTab);
      }
    }
  };

  return (
    <Modal
      title={`profile settings: ${profile.name}`}
      onClose={onClose}
      width="xl"
      footer={renderFooter()}
      className="h-[650px] min-h-[550px] flex flex-col"
    >
      <div className="flex h-full">
        <div
          ref={sidebarRef}
          className="w-64 flex flex-col"
        >
          <div className="space-y-0 flex-1">
            {tabConfig.map((tab) => {
              const isActive = activeTab === tab.id;

              return (
                <div key={tab.id} className="w-full">
                  <button
                    className={cn(
                      "w-full text-left p-3 transition-all duration-200 rounded-none relative border-0 outline-none",
                      isActive
                        ? "border-l-2 shadow-sm text-white"
                        : "bg-transparent border-transparent text-white/70 hover:text-white",
                    )}
                    style={
                      isActive
                        ? {
                            backgroundColor: `${accentColor.value}10`, // 60% opacity
                            borderLeftColor: accentColor.value,
                            color: "white"
                          }
                        : {
                            "--hover-bg": `${accentColor.value}33` // 20% opacity for hover
                          } as any
                    }
                    onClick={() => handleTabClick(tab.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        icon={tab.icon}
                        className={cn(
                          "w-6 h-6 transition-colors duration-200",
                          isActive ? "" : "text-white/50",
                        )}
                        style={isActive ? { color: accentColor.value } : {}}
                      />
                      <span
                        className={cn(
                          "font-minecraft text-3xl lowercase transition-colors duration-200",
                          isActive ? "font-medium" : "",
                        )}
                        style={isActive ? { color: accentColor.value } : {}}
                      >
                        {tab.label}
                      </span>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Vertical separator line */}
        <div className="flex items-center">
          <div className="border-l border-white/10 mx-4 my-3 h-[85%]"></div>
        </div>

        <div className="flex-1 flex flex-col">
          <div
            className="flex-1 py-2 pl-0 pr-4 overflow-y-auto custom-scrollbar"
            ref={contentRef}
          >
            {renderTabContent()}
          </div>
        </div>
      </div>
    </Modal>
  );
}
