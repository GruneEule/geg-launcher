"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";

import { TabLayout } from "../ui/TabLayout";
import { Card } from "../ui/Card";
import { Button } from "../ui/buttons/Button";
import { StatusMessage } from "../ui/StatusMessage";
import { useThemeStore } from "../../store/useThemeStore";
import { ModrinthService } from "../../services/modrinth-service";
import type { ModrinthProject, ModrinthVersion } from "../../types/modrinth";

const MODPACK_PROJECT_ID = "kUYTdD3h"; // GEG Basic Play

export function GEGTab() {
  const accentColor = useThemeStore((s) => s.accentColor);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<ModrinthProject | null>(null);
  const [versions, setVersions] = useState<ModrinthVersion[]>([]);
  const [installing, setInstalling] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [projects] = await Promise.all([
          ModrinthService.getProjectDetails([MODPACK_PROJECT_ID]),
        ]);
        if (!isMounted) return;
        const proj = projects?.[0] ?? null;
        setProject(proj);
        try {
          const vers = await ModrinthService.getModVersions(MODPACK_PROJECT_ID);
          if (!isMounted) return;
          setVersions(vers || []);
        } catch (e) {
          console.warn("Failed to load modpack versions", e);
        }
      } catch (e) {
        console.error(e);
        setError(
          e instanceof Error ? e.message : "Failed to load Modrinth project",
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const latestVersion = useMemo(() => {
    if (!versions || versions.length === 0) return null;
    return versions[0];
  }, [versions]);

  const handleInstall = async () => {
    if (!project || !latestVersion) return;
    setInstalling(true);
    const primaryFile = latestVersion.files.find((f) => f.primary) || latestVersion.files[0];
    if (!primaryFile) {
      toast.error("No downloadable file found for latest version.");
      setInstalling(false);
      return;
    }
    const downloadUrl = primaryFile.url;
    const fileName = primaryFile.filename || `${project.slug || project.id}-${latestVersion.version_number}.mrpack`;
    const promise = ModrinthService.downloadAndInstallModpack(
      project.id,
      latestVersion.id,
      fileName,
      downloadUrl,
      project.icon_url || undefined,
    );
    toast
      .promise(promise, {
        loading: `Installing ${project.title || project.slug}...`,
        success: (profileId) => `Installed as profile ${profileId}`,
        error: (err) => (err instanceof Error ? err.message : String(err)),
      })
      .finally(() => setInstalling(false));
  };

  return (
    <TabLayout
      title="GEG"
      icon="solar:link-bold"
      actions={
        <Button
          onClick={async () => {
            const url = "https://grueneeule.de/dc";
            try {
              const shell = await import("@tauri-apps/plugin-shell").catch(() => null);
              if (shell && typeof shell.open === "function") {
                await shell.open(url);
              } else {
                window.open(url, "_blank", "noopener,noreferrer");
              }
            } catch (_) {
              try {
                window.open(url, "_blank", "noopener,noreferrer");
              } catch {}
            }
          }}
          variant="flat"
          size="md"
          icon={<Icon icon="mdi:discord" className="w-5 h-5" />}
          iconPosition="left"
        >
          JOIN DISCORD
        </Button>
      }
    >
      <div className="space-y-10">
        <section>
          <h2 className="font-minecraft text-4xl lowercase text-white mb-4 flex items-center gap-2">
            <Icon icon="solar:box-bold" className="w-6 h-6" /> Modpacks
          </h2>
          {loading ? (
            <p className="text-white/70 font-minecraft">Loading modpack...</p>
          ) : error ? (
            <StatusMessage type="error" message={error} />
          ) : project ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(560px,1fr))] gap-4">
              <Card
                className="p-4 flex gap-4 items-center cursor-pointer"
                variant="flat"
                onClick={async () => {
                  const url = `https://modrinth.com/modpack/${project.slug || project.id}`;
                  try {
                    const shell = await import("@tauri-apps/plugin-shell").catch(() => null);
                    if (shell && typeof shell.open === "function") {
                      await shell.open(url);
                    } else {
                      window.open(url, "_blank", "noopener,noreferrer");
                    }
                  } catch (_) {
                    try {
                      window.open(url, "_blank", "noopener,noreferrer");
                    } catch {}
                  }
                }}
              >
                <img
                  src={project.icon_url || "/icons/minecraft.png"}
                  alt={project.title || project.slug || project.id}
                  className="w-16 h-16 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-minecraft text-3xl text-white lowercase">
                    {project.title || project.slug || project.id}
                  </p>
                  <p className="text-white/60 font-minecraft text-lg truncate">
                    {project.description}
                  </p>
                  {latestVersion && (
                    <p className="text-white/50 font-minecraft text-md mt-1">
                      Latest: {latestVersion.name || latestVersion.version_number}
                    </p>
                  )}
                </div>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleInstall();
                  }}
                  variant="flat"
                  size="md"
                  disabled={!latestVersion || installing}
                  className="whitespace-nowrap"
                  icon={<Icon icon="solar:download-bold" className="w-5 h-5" />}
                  iconPosition="left"
                >
                  {installing ? "Installing..." : "Install"}
                </Button>
              </Card>
            </div>
          ) : (
            <p className="text-white/70 font-minecraft">No modpack found.</p>
          )}
        </section>
      </div>
    </TabLayout>
  );
}


