import { create } from "zustand";
import { persist } from "zustand/middleware";
import { setProfileGroupingPreference } from "../services/launcher-config-service";
import { ModPlatform } from "../types/unified";

export type AccentColor = {
  name: string;
  value: string;
  hoverValue: string;
  shadowValue: string;
  light: string;
  dark: string;
  isCustom?: boolean;
};

export const ACCENT_COLORS: Record<string, AccentColor> = {
  // Deine gewünschten Farben
  seagreen: {
    name: "Sea Green",
    value: "#2e8b57",
    hoverValue: "#267349",
    shadowValue: "rgba(46, 139, 87, 0.5)",
    light: "#3da769",
    dark: "#1e5631",
  },
  coral: {
    name: "Coral",
    value: "#ff7f50",
    hoverValue: "#ff6b38",
    shadowValue: "rgba(255, 127, 80, 0.5)",
    light: "#ff9c7a",
    dark: "#e65c2e",
  },
  forest: {
    name: "Forest",
    value: "#1e5631",
    hoverValue: "#164325",
    shadowValue: "rgba(30, 86, 49, 0.5)",
    light: "#267349",
    dark: "#133820",
  },
  
  // Weitere coole Farben
  mint: {
    name: "Mint",
    value: "#00c9b1",
    hoverValue: "#00b09a",
    shadowValue: "rgba(0, 201, 177, 0.5)",
    light: "#00e6cc",
    dark: "#009c87",
  },
  lavender: {
    name: "Lavender",
    value: "#9673e0",
    hoverValue: "#845fd6",
    shadowValue: "rgba(150, 115, 224, 0.5)",
    light: "#ab8fe9",
    dark: "#7a57c7",
  },
  sunset: {
    name: "Sunset",
    value: "#ff6b6b",
    hoverValue: "#ff5252",
    shadowValue: "rgba(255, 107, 107, 0.5)",
    light: "#ff8e8e",
    dark: "#e84545",
  },
  gold: {
    name: "Gold",
    value: "#ffd700",
    hoverValue: "#e6c200",
    shadowValue: "rgba(255, 215, 0, 0.5)",
    light: "#ffe44d",
    dark: "#ccac00",
  },
  ocean: {
    name: "Ocean",
    value: "#1e90ff",
    hoverValue: "#0077e6",
    shadowValue: "rgba(30, 144, 255, 0.5)",
    light: "#4da6ff",
    dark: "#0066cc",
  },
  berry: {
    name: "Berry",
    value: "#c71585",
    hoverValue: "#a8126f",
    shadowValue: "rgba(199, 21, 133, 0.5)",
    light: "#e6399c",
    dark: "#8f0e5c",
  },
  slate: {
    name: "Slate",
    value: "#2f4f4f",
    hoverValue: "#253d3d",
    shadowValue: "rgba(47, 79, 79, 0.5)",
    light: "#3a6363",
    dark: "#1a2f2f",
  },
  peach: {
    name: "Peach",
    value: "#ffb347",
    hoverValue: "#ffa533",
    shadowValue: "rgba(255, 179, 71, 0.5)",
    light: "#ffc67a",
    dark: "#e69a3e",
  },
  teal: {
    name: "Teal",
    value: "#008080",
    hoverValue: "#006666",
    shadowValue: "rgba(0, 128, 128, 0.5)",
    light: "#00a3a3",
    dark: "#005959",
  },
  plum: {
    name: "Plum",
    value: "#8e4585",
    hoverValue: "#773a6f",
    shadowValue: "rgba(142, 69, 133, 0.5)",
    light: "#a55c9c",
    dark: "#6a3363",
  }
};

const calculateColorVariants = (baseColor: string): Partial<AccentColor> => {
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: Number.parseInt(result[1], 16),
          g: Number.parseInt(result[2], 16),
          b: Number.parseInt(result[3], 16),
        }
      : null;
  };

  const rgbToHex = (r: number, g: number, b: number) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  const darken = (hex: string, amount: number) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;

    return rgbToHex(
      Math.max(0, Math.floor(rgb.r * (1 - amount))),
      Math.max(0, Math.floor(rgb.g * (1 - amount))),
      Math.max(0, Math.floor(rgb.b * (1 - amount))),
    );
  };

  const lighten = (hex: string, amount: number) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;

    return rgbToHex(
      Math.min(255, Math.floor(rgb.r + (255 - rgb.r) * amount)),
      Math.min(255, Math.floor(rgb.g + (255 - rgb.g) * amount)),
      Math.min(255, Math.floor(rgb.b + (255 - rgb.b) * amount)),
    );
  };

  const calculateShadow = (hex: string) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return `rgba(0, 0, 0, 0.5)`;

    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)`;
  };

  return {
    value: baseColor,
    hoverValue: darken(baseColor, 0.1),
    shadowValue: calculateShadow(baseColor),
    light: lighten(baseColor, 0.2),
    dark: darken(baseColor, 0.2),
    isCustom: true,
  };
};

export const DEFAULT_BORDER_RADIUS = 0; 
export const MIN_BORDER_RADIUS = 0;
export const MAX_BORDER_RADIUS = 32;

interface ThemeState {
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;
  setCustomAccentColor: (hexColor: string) => void;
  applyAccentColorToDOM: () => void;
  customColorHistory: string[];
  addToCustomColorHistory: (hexColor: string) => void;
  clearCustomColorHistory: () => void;
  isBackgroundAnimationEnabled: boolean;
  isDetailViewSidebarOnLeft: boolean;
  toggleDetailViewSidebarPosition: () => void;
  profileGroupingCriterion: string;
  setProfileGroupingCriterion: (criterion: string) => Promise<void>;
  staticBackground: boolean;
  toggleStaticBackground: () => void;
  toggleBackgroundAnimation: () => void;
  hasAcceptedTermsOfService: boolean;
  acceptTermsOfService: () => void;
  borderRadius: number;
  setBorderRadius: (radius: number) => void;
  applyBorderRadiusToDOM: () => void;
  collapsedProfileGroups: string[];
  setCollapsedProfileGroups: (groups: string[]) => void;
  toggleCollapsedProfileGroup: (groupKey: string) => void;
  // ProfilesTabV2 persistent filters
  profilesTabActiveGroup: string;
  profilesTabSortBy: string;
  profilesTabVersionFilter: string;
  profilesTabLayoutMode: "list" | "grid" | "compact";
  setProfilesTabActiveGroup: (group: string) => void;
  setProfilesTabSortBy: (sortBy: string) => void;
  setProfilesTabVersionFilter: (filter: string) => void;
  setProfilesTabLayoutMode: (mode: "list" | "grid" | "compact") => void;
  // Global context menu management
  openContextMenuId: string | null;
  setOpenContextMenuId: (id: string | null) => void;
  // Mod source selection
  modSource: ModPlatform;
  setModSource: (source: ModPlatform) => void;
  // News section width
  newsSectionWidth: number;
  setNewsSectionWidth: (width: number) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      accentColor: ACCENT_COLORS.seagreen, // Standardfarbe auf Sea Green geändert
      isBackgroundAnimationEnabled: false,
      isDetailViewSidebarOnLeft: true,
      profileGroupingCriterion: "group",
      staticBackground: true,
      hasAcceptedTermsOfService: false,
      customColorHistory: [],
      borderRadius: DEFAULT_BORDER_RADIUS,
      collapsedProfileGroups: [],
      // ProfilesTabV2 persistent filters - defaults
      profilesTabActiveGroup: "all",
      profilesTabSortBy: "last_played",
      profilesTabVersionFilter: "all",
      profilesTabLayoutMode: "list",
      // Global context menu management - defaults
      openContextMenuId: null,
      // Mod source selection - defaults
      modSource: ModPlatform.Modrinth,
      // News section width - defaults
      newsSectionWidth: 375,

      setAccentColor: (color: AccentColor) => {
        set({ accentColor: color });
        get().applyAccentColorToDOM();
      },

      setBorderRadius: (radius: number) => {
        const clampedRadius = Math.max(MIN_BORDER_RADIUS, Math.min(MAX_BORDER_RADIUS, radius));
        set({ borderRadius: clampedRadius });
        get().applyBorderRadiusToDOM();
      },

      setCustomAccentColor: (hexColor: string) => {
        const colorVariants = calculateColorVariants(hexColor);
        const customColor: AccentColor = {
          name: "Custom",
          ...colorVariants,
        } as AccentColor;

        set({ accentColor: customColor });
        get().applyAccentColorToDOM();
        get().addToCustomColorHistory(hexColor);
      },

      addToCustomColorHistory: (hexColor: string) => {
        set((state) => {
          const newHistory = [...state.customColorHistory];
          
          const existingIndex = newHistory.indexOf(hexColor);
          if (existingIndex > -1) {
            newHistory.splice(existingIndex, 1);
          }
          
          newHistory.unshift(hexColor);
          
          if (newHistory.length > 10) {
            newHistory.pop();
          }
          
          return { customColorHistory: newHistory };
        });
      },

      clearCustomColorHistory: () => {
        set({ customColorHistory: [] });
      },

      toggleBackgroundAnimation: () => {
        set((state) => ({
          isBackgroundAnimationEnabled: !state.isBackgroundAnimationEnabled,
        }));
      },

      toggleDetailViewSidebarPosition: () => {
        set((state) => ({
          isDetailViewSidebarOnLeft: !state.isDetailViewSidebarOnLeft,
        }));
      },

      setProfileGroupingCriterion: async (criterion: string) => {
        try {
          await setProfileGroupingPreference(criterion);
          set({ profileGroupingCriterion: criterion });
        } catch (error) {
          console.error("Failed to save grouping preference:", error);
          set({ profileGroupingCriterion: criterion });
          throw error;
        }
      },

      toggleStaticBackground: () => {
        set((state) => ({ staticBackground: !state.staticBackground }));
      },      acceptTermsOfService: () => {
        set({ hasAcceptedTermsOfService: true });      },      applyAccentColorToDOM: () => {
        const { accentColor } = get();

        const hexToRgb = (hex: string) => {
          const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
          return result
            ? `${Number.parseInt(result[1], 16)}, ${Number.parseInt(result[2], 16)}, ${Number.parseInt(result[3], 16)}`
            : null;
        };

        document.documentElement.style.setProperty(
          "--accent",
          accentColor.value,
        );
        document.documentElement.style.setProperty(
          "--accent-hover",
          accentColor.hoverValue,
        );
        document.documentElement.style.setProperty(
          "--accent-shadow",
          accentColor.shadowValue,
        );
        document.documentElement.style.setProperty(
          "--accent-light",
          accentColor.light,
        );
        document.documentElement.style.setProperty(
          "--accent-dark",
          accentColor.dark,
        );

        const rgbValue = hexToRgb(accentColor.value);
        if (rgbValue) {
          document.documentElement.style.setProperty("--accent-rgb", rgbValue);
        }
      },      applyBorderRadiusToDOM: () => {
        const { borderRadius } = get();
        
        document.documentElement.style.setProperty("--border-radius", `${borderRadius}px`);
        
        document.documentElement.setAttribute("data-border-radius", borderRadius.toString());
        if (borderRadius === 0) {
          document.documentElement.classList.add("radius-flat");
        } else {
          document.documentElement.classList.remove("radius-flat");
        }
      },

      setCollapsedProfileGroups: (groups: string[]) => {
        set({ collapsedProfileGroups: [...groups] });
      },

      toggleCollapsedProfileGroup: (groupKey: string) => {
        set((state) => {
          const isCollapsed = state.collapsedProfileGroups.includes(groupKey);
          const next = isCollapsed
            ? state.collapsedProfileGroups.filter((g) => g !== groupKey)
            : [...state.collapsedProfileGroups, groupKey];
          return { collapsedProfileGroups: next };
        });
      },

      // ProfilesTabV2 persistent filters setters
      setProfilesTabActiveGroup: (group: string) => {
        set({ profilesTabActiveGroup: group });
      },

      setProfilesTabSortBy: (sortBy: string) => {
        set({ profilesTabSortBy: sortBy });
      },

      setProfilesTabVersionFilter: (filter: string) => {
        set({ profilesTabVersionFilter: filter });
      },

      setProfilesTabLayoutMode: (mode: "list" | "grid" | "compact") => {
        set({ profilesTabLayoutMode: mode });
      },

      // Global context menu management
      setOpenContextMenuId: (id: string | null) => {
        set({ openContextMenuId: id });
      },

      // Mod source selection
      setModSource: (source: ModPlatform) => {
        set({ modSource: source });
      },

      // News section width
      setNewsSectionWidth: (width: number) => {
        set({ newsSectionWidth: width });
      },
    }),    {
      name: "norisk-theme-storage",
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Migration: Replace old "none" grouping criterion with "group"
          if (state.profileGroupingCriterion === "none") {
            state.profileGroupingCriterion = "group";
          }
          
          state.applyAccentColorToDOM();
          state.applyBorderRadiusToDOM();
          // Ensure collapsedProfileGroups exists after rehydrate
          if (!Array.isArray(state.collapsedProfileGroups)) {
            state.collapsedProfileGroups = [];
          }
        }
      },
    },
  ),
);