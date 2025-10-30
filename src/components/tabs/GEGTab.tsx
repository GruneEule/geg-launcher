"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";

import { TabLayout } from "../ui/TabLayout";
import { Card } from "../ui/Card";
import { Button } from "../ui/buttons/Button";
import { StatusMessage } from "../ui/StatusMessage";
import { ModrinthService } from "../../services/modrinth-service";
import type { ModrinthProject, ModrinthVersion } from "../../types/modrinth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/Tabs";

const ORGANIZATION_ID = "qrldrfiD"; // Grüne Eule Gaming

type GroupedProjects = {
  [key: string]: ModrinthProject[];
};

export function GEGTab() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<ModrinthProject[]>([]);
  const [installing, setInstalling] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const orgProjects = await ModrinthService.getOrganizationProjects(ORGANIZATION_ID);
        if (isMounted) {
          setProjects(orgProjects || []);
        }
      } catch (e) {
        console.error(e);
        setError(
          e instanceof Error ? e.message : "Failed to load Modrinth projects",
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

  const groupedProjects = useMemo(() => {
    return projects.reduce((acc, project) => {
      const key = project.project_type;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(project);
      return acc;
    }, {} as GroupedProjects);
  }, [projects]);

  const handleInstall = async (project: ModrinthProject) => {
    setInstalling(project.id);
    try {
      const versions = await ModrinthService.getModVersions(project.id);
      const latestVersion = versions?.[0];
      if (!latestVersion) {
        toast.error("No versions found for this project.");
        return;
      }
      const primaryFile = latestVersion.files.find((f) => f.primary) || latestVersion.files[0];
      if (!primaryFile) {
        toast.error("No downloadable file found for latest version.");
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
      await toast.promise(promise, {
        loading: `Installing ${project.title || project.slug}...`,
        success: (profileId) => `Installed as profile ${profileId}`,
        error: (err) => (err instanceof Error ? err.message : String(err)),
      });
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to install modpack");
    } finally {
      setInstalling(null);
    }
  };

  const openLink = async (url: string) => {
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
  };

  return (
    <TabLayout
      title="GEG"
      icon="solar:link-bold"
      actions={
        <Button
          onClick={() => openLink("https://grueneeule.de/dc")}
          variant="flat"
          size="md"
          icon={<Icon icon="mdi:discord" className="w-5 h-5" />}
          iconPosition="left"
        >
          JOIN DISCORD
        </Button>
      }
    >
      {loading ? (
        <p className="text-white/70 font-minecraft">Loading projects...</p>
      ) : error ? (
        <StatusMessage type="error" message={error} />
      ) : projects.length > 0 ? (
        <Tabs defaultValue={Object.keys(groupedProjects)[0]}>
          <TabsList>
            {Object.keys(groupedProjects).map((projectType) => (
              <TabsTrigger key={projectType} value={projectType}>
                {projectType.replace(/_/g, ' ')}
              </TabsTrigger>
            ))}
          </TabsList>
          {Object.entries(groupedProjects).map(([projectType, projects]) => (
            <TabsContent key={projectType} value={projectType}>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(560px,1fr))] gap-4 mt-4">
                {projects.map((project) => (
                  <Card
                    key={project.id}
                    className="p-4 flex gap-4 items-center cursor-pointer"
                    variant="flat"
                    onClick={() => openLink(`https://modrinth.com/${project.project_type}/${project.slug || project.id}`)}
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
                    </div>
                    {project.project_type === 'modpack' && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInstall(project);
                        }}
                        variant="flat"
                        size="md"
                        disabled={installing === project.id}
                        className="whitespace-nowrap"
                        icon={<Icon icon="solar:download-bold" className="w-5 h-5" />}
                        iconPosition="left"
                      >
                        {installing === project.id ? "Installing..." : "Install"}
                      </Button>
                    )}
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <p className="text-white/70 font-minecraft">No projects found.</p>
      )}
    </TabLayout>
  );
}