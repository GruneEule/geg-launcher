"use client";

import { TabHeader } from "../ui/TabHeader";
import { TabContent } from "../ui/TabContent";

export function StoreTab() {
  return (
    <div className="flex flex-col h-full">
      <TabHeader title="Store" description="Cosmetics and capes system has been removed" />
      <TabContent>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">This section has been removed in the GEG Launcher.</p>
        </div>
      </TabContent>
    </div>
  );
}
