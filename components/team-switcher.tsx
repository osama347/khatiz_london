"use client";

import * as React from "react";

export function TeamSwitcher() {
  return (
    <div className="flex items-center gap-2 px-1.5">
      <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-5 items-center justify-center rounded-md">
        <span className="text-xs">EL</span>
      </div>
      <span className="truncate font-medium">East London</span>
    </div>
  );
}
