import { ExtensionContext } from "@foxglove/extension";

import { initPathPlannerPanel } from "./pathPlannerPanel";

export function activate(extensionContext: ExtensionContext): void {
  extensionContext.registerPanel({
    name: "Path Planner 3D",
    initPanel: initPathPlannerPanel,
  });
}

