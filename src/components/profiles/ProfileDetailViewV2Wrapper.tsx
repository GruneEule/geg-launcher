"use client";

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProfileStore } from "../../store/profile-store";
import { LoadingState } from "../ui/LoadingState";
import { EmptyState } from "../ui/EmptyState";
import { ProfileDetailViewV2 } from "./ProfileDetailViewV2";
import type { Profile } from "../../types/profile";
import { useProfileSettingsStore } from "../../store/profile-settings-store";

export function ProfileDetailViewV2Wrapper() {
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();
  const { profiles, loading, fetchProfiles } = useProfileStore();
  const [profile, setProfile] = useState<Profile | null>(null);

  // Profile settings store for edit modal
  const { openModal } = useProfileSettingsStore();

  useEffect(() => {
    if (!profiles.length && !loading) {
      fetchProfiles();
    }
  }, [profiles.length, loading, fetchProfiles]);

  useEffect(() => {
    if (profileId && profiles.length > 0) {
      const foundProfile = profiles.find(p => p.id === profileId);
      setProfile(foundProfile || null);
    }
  }, [profileId, profiles]);

  const handleClose = () => {
    navigate("/profiles");
  };

  const handleEdit = () => {
    if (profile) {
      openModal(profile);
    }
  };

  if (loading) {
    return <LoadingState message="Loading profile..." />;
  }

  if (!profileId) {
    return (
      <EmptyState
        icon="solar:danger-triangle-bold"
        message="No profile ID provided"
      />
    );
  }

  if (!profile) {
    return (
      <EmptyState
        icon="solar:widget-bold"
        message="Profile not found"
      />
    );
  }

  return (
    <ProfileDetailViewV2
      profile={profile}
      onClose={handleClose}
      onEdit={handleEdit}
    />
  );
}
