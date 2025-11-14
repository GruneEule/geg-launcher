import { log } from '../utils/logging-utils';

/**
 * Configuration for blocked mods that cause crashes or compatibility issues.
 */
export interface BlockedModsConfig {
  exact_filenames: string[];
  filename_patterns: string[];
  mod_ids: string[];
  modrinth_project_ids: string[];
  description: string;
}

/**
 * STUB IMPLEMENTATION: Flagsmith has been disabled for the GEG Launcher.
 * This returns an empty configuration (no mods are blocked).
 */

let cachedBlockedModsConfig: BlockedModsConfig | null = null;
let configFetchPromise: Promise<BlockedModsConfig> | null = null;

const getDefaultConfig = (): BlockedModsConfig => ({
  exact_filenames: [],
  filename_patterns: [],
  mod_ids: [],
  modrinth_project_ids: [],
  description: 'Feature flags disabled - no mods blocked',
});

/**
 * Fetches the blocked mods configuration.
 * Stub implementation returns empty config (no blocked mods).
 *
 * @returns A promise that resolves to the BlockedModsConfig object.
 */
export const getBlockedModsConfig = async (): Promise<BlockedModsConfig> => {
  if (cachedBlockedModsConfig) {
    return cachedBlockedModsConfig;
  }

  if (configFetchPromise) {
    return configFetchPromise;
  }

  configFetchPromise = (async () => {
    try {
      log('info', 'Fetching blocked mods configuration (stub implementation)...');
      const config = getDefaultConfig();
      cachedBlockedModsConfig = config;
      log('info', 'Blocked mods configuration loaded (empty - no mods blocked)');
      return config;
    } catch (error) {
      log('error', `Failed to fetch blocked mods configuration: ${error}`);
      // Return empty config on error
      return getDefaultConfig();
    } finally {
      configFetchPromise = null;
    }
  })();

  return configFetchPromise;
};

/**
 * Refreshes the cached blocked mods configuration.
 * Stub implementation - does nothing.
 */
export const refreshBlockedModsConfig = async (): Promise<void> => {
  log('info', 'Refreshing blocked mods configuration (stub)...');
  cachedBlockedModsConfig = null;
  configFetchPromise = null;
  // Re-fetch the config
  await getBlockedModsConfig();
};

/**
 * Checks if a specific filename is blocked.
 * Stub implementation - always returns false.
 *
 * @param filename - The filename to check
 * @returns False (no files are blocked)
 */
export const isFilenameBlocked = async (filename: string): Promise<boolean> => {
  // Stub: no filenames are blocked
  return false;
};

/**
 * Checks if a specific mod ID is blocked.
 * Stub implementation - always returns false.
 *
 * @param modId - The mod ID to check
 * @returns False (no mods are blocked)
 */
export const isModIdBlocked = async (modId: string): Promise<boolean> => {
  // Stub: no mod IDs are blocked
  return false;
};

/**
 * Checks if a specific Modrinth project ID is blocked.
 * Stub implementation - always returns false.
 *
 * @param modrinthProjectId - The Modrinth project ID to check
 * @returns False (no projects are blocked)
 */
export const isModrinthProjectIdBlocked = async (modrinthProjectId: string): Promise<boolean> => {
  // Stub: no project IDs are blocked
  return false;
};

/**
 * Checks if a mod is blocked by the GEG client configuration.
 * Stub implementation - always returns false (no mods blocked).
 *
 * @param filename The filename of the mod.
 * @param modrinthProjectId The Modrinth project ID, if available.
 * @returns `false` (no mods are blocked)
 */
export const isModBlockedByGEG = (
  filename: string,
  modrinthProjectId?: string | null,
): boolean => {
  // Stub: no mods are blocked
  return false;
};
