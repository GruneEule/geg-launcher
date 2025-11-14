"use client";

import { Icon } from "@iconify/react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/buttons/Button";
import { useSocialsModalStore } from "../../store/socials-modal-store";
import { openExternalUrl } from "../../services/tauri-service";
import { IconButton } from "../ui/buttons/IconButton";

// Define a type for social platform configuration
interface SocialPlatform {
  key: string;
  name:string;
  icon: string;
  visitUrl?: string;
  isImplemented: boolean;
}

export function SocialsModal() {
  const { isModalOpen, closeModal } = useSocialsModalStore();

  const socialPlatforms: SocialPlatform[] = [
    {
      key: "discord",
      name: "Discord",
      icon: "ic:baseline-discord",
      visitUrl: "https://grueneeule.de/dc",
      isImplemented: false,
    },
  ];

  if (!isModalOpen) {
    return null;
  }

  const renderPlatformRow = (platform: SocialPlatform) => {
    return (
      <div
        key={platform.key}
        className="flex items-center justify-between p-3 bg-black/20 rounded-md mb-2 gap-2"
      >
        <div className="flex items-center flex-grow">
          <Icon
            icon={platform.icon}
            className="w-7 h-7 mr-3 text-white/80 flex-shrink-0"
          />
          <span className="text-white/90 font-medium font-minecraft-ten text-xs">
            Link {platform.name} account
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Button
            variant="secondary"
            size="sm"
            disabled
            icon={<Icon icon="mdi:link-variant" />}
          >
            Link
          </Button>
          {platform.visitUrl && (
            <IconButton
              variant="ghost"
              size="sm"
              onClick={() => openExternalUrl(platform.visitUrl!)}
              icon={
                <Icon
                  icon="mdi:arrow-top-right-bold-box-outline"
                  className="w-5 h-5"
                />
              }
              aria-label={`Visit ${platform.name} page`}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <Modal
        title="Social Accounts"
        titleIcon={
          <Icon icon="fluent:people-community-20-filled" className="w-7 h-7" />
        }
        onClose={closeModal}
        width="md"
      >
        <div className="p-4 space-y-2 min-h-[45vh] max-h-[70vh] overflow-y-auto custom-scrollbar">
          {socialPlatforms.map(renderPlatformRow)}
        </div>
      </Modal>
    </>
  );
}
