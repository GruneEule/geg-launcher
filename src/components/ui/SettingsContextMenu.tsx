"use client";

import React, { useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import { useThemeStore } from "../../store/useThemeStore";
import type { Profile } from "../../types/profile";

export interface ContextMenuItem {
  /** Unique identifier for the menu item */
  id: string;
  /** Label text to display */
  label: string;
  /** Icon to display */
  icon: string;
  /** Whether this is a destructive action (like delete) */
  destructive?: boolean;
  /** Whether to show a separator before this item */
  separator?: boolean;
  /** Whether this item is disabled */
  disabled?: boolean;
  /** Click handler */
  onClick: (profile: Profile) => void;
}

export interface SettingsContextMenuProps {
  /** The profile this menu is for */
  profile: Profile;
  /** Whether the menu is visible */
  isOpen: boolean;
  /** Position coordinates */
  position: { x: number; y: number };
  /** Menu items to display */
  items: ContextMenuItem[];
  /** Close handler */
  onClose: () => void;
}

export function SettingsContextMenu({
  profile,
  isOpen,
  position,
  items,
  onClose,
}: SettingsContextMenuProps) {
  const accentColor = useThemeStore((state) => state.accentColor);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => {
        document.removeEventListener("keydown", handleEscape);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="absolute bg-black/90 backdrop-blur-sm border border-white/20 rounded-lg shadow-xl z-50 overflow-hidden"
      style={{
        left: position.x,
        top: position.y,
        minWidth: "200px",
      }}
    >
      <div className="py-2">
        {items.map((item) => (
          <React.Fragment key={item.id}>
            {/* Separator */}
            {item.separator && (
              <div className="h-px bg-white/10 mx-2 my-2" />
            )}
            
            <button
              onClick={() => {
                if (!item.disabled) {
                  item.onClick(profile);
                  onClose();
                }
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left font-minecraft-ten text-sm transition-colors duration-150 ${
                item.disabled
                  ? 'text-white/30 cursor-not-allowed opacity-50'
                  : item.destructive
                    ? 'text-red-400 hover:bg-red-600/10 hover:text-red-300'
                    : 'text-white/80 hover:text-white'
              }`}
              style={{
                backgroundColor: item.destructive ? undefined : 'transparent',
              }}
              onMouseEnter={!item.destructive && !item.disabled ? (e) => {
                e.currentTarget.style.backgroundColor = `${accentColor.value}15`;
              } : undefined}
              onMouseLeave={!item.destructive && !item.disabled ? (e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              } : undefined}
              disabled={item.disabled}
            >
              <Icon 
                icon={item.icon} 
                className={`w-4 h-4 flex-shrink-0 ${
                  item.disabled
                    ? 'text-white/30'
                    : item.destructive 
                      ? 'text-red-400' 
                      : 'text-white/70'
                }`} 
              />
              <span className="flex-1">{item.label}</span>
            </button>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
