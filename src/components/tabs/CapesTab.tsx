import React from "react";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { Button } from "../ui/buttons/Button";

export function CapesTab() {
  const openCapesBrowser = async () => {
    try {
      // Create a new webview window for the capes browser
      const capesWindow = new WebviewWindow('capes-browser', {
        url: 'https://minecraftcapes.net/',
        title: 'GEG Launcher | Capes',
        width: 1200,
        height: 800,
        resizable: true,
        maximizable: true,
        minimizable: true,
        closable: true,
        decorations: true,
        center: true,
        visible: true,
      });

      // Wait for the window to be created
      await capesWindow;
    } catch (error) {
      console.error('Failed to open capes browser:', error);
    }
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-2xl">
        <h2 className="text-4xl font-minecraft text-white mb-6">Customize Your Capes</h2>
        <p className="text-lg text-white/80 mb-8 font-minecraft-ten">
          Click the button below to open the cape customization browser.
        </p>
        <div className="flex justify-center">
          <Button
            onClick={openCapesBrowser}
            size="xl"
            variant="3d"
          >
            Customize Capes
          </Button>
        </div>
        <p className="text-sm text-white/60 mt-6 font-minecraft-ten">
          Powered by MinecraftCapes.net
        </p>
      </div>
    </div>
  );
}
