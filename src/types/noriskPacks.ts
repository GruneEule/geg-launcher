// src/lib/types/GEGPacks.ts

// Types matching backend Rust structures for GEG Packs

// Corresponds to Rust struct CompatibilityTarget
export interface CompatibilityTarget {
    identifier: string;
    filename: string | null;
}

// Corresponds to Rust enum GEGModSourceDefinition
export type GEGModSourceDefinition =
    | { type: 'modrinth'; project_id: string; project_slug: string } // Renamed fields to snake_case
    | { type: 'maven'; repository_ref: string; group_id: string; artifact_id: string } // Renamed fields to snake_case
    | { type: 'url' };

// Corresponds to Rust struct GEGModEntryDefinition (previously GEGPackMod)
export interface GEGModEntryDefinition { // Renamed from GEGPackMod
    id: string;
    displayName?: string | null; // Made optional
    source: GEGModSourceDefinition; // Updated type
    // compatibility field structure: Record<GameVersion, Record<Loader, CompatibilityTarget>>
    compatibility?: Record<string,
        Record<string, CompatibilityTarget> // Updated inner type
    >;
}

// Corresponds to Rust struct GEGPackDefinition
export interface GEGPackDefinition {
    displayName: string; // Correct
    description: string; // Correct
    inheritsFrom?: string[] | null; // Added field
    excludeMods?: string[] | null; // Added field
    mods?: GEGModEntryDefinition[]; // Updated type used
    assets?: string[]; // Added field
    isExperimental?: boolean; // Added field
}

// Corresponds to Rust struct GEGModpacksConfig
export interface GEGModpacksConfig {
    packs: Record<string, GEGPackDefinition>; // Maps pack ID (string) to definition
    repositories: Record<string, string>; // Maps repository reference (string) to URL (string)
} 
