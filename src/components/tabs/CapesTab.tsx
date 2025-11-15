import React, { useRef, useEffect } from "react";
import { open } from "@tauri-apps/plugin-shell";

export function CapesTab() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const initialSrc = "https://minecraftcapes.net/";

  const handleLoad = () => {
    if (iframeRef.current) {
      try {
        const currentSrc = iframeRef.current.contentWindow?.location.href;
        if (currentSrc && !currentSrc.startsWith(initialSrc)) {
          // It's an external link, open in default browser
          open(currentSrc);
          // Reset iframe to initial source to prevent external site from loading inside
          iframeRef.current.src = initialSrc;
        }
      } catch (e) {
        // This catch block handles the SecurityError due to same-origin policy
        // when trying to access contentWindow.location.href for a cross-origin frame.
        // In this case, we assume it's an external navigation attempt.
        console.warn("Blocked attempt to access cross-origin iframe content. Assuming external navigation.", e);
        // We can't get the exact URL, so we might just reset or do nothing.
        // For now, we'll just log and let the iframe try to navigate (which it will).
        // A more robust solution would involve a custom webview with URL interception.
      }
    }
  };

  return (
    <div className="h-full w-full flex flex-col">
      <iframe
        ref={iframeRef}
        src={initialSrc}
        title="Minecraft Capes"
        className="flex-1 w-full h-full border-none"
        onLoad={handleLoad}
      ></iframe>
    </div>
  );
}
