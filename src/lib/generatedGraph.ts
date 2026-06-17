import type { PlanningTab, ProjectFile } from "../types/planning";

export function isGeneratedGraphTab(tab: PlanningTab | undefined) {
  if (!tab) {
    return false;
  }

  const kind = tab.kind?.toLowerCase() ?? "";

  return (
    tab.generated === true ||
    kind.includes("generated") ||
    kind.includes("software") ||
    kind.includes("graph")
  );
}

export function isTabReadOnly(project: ProjectFile, tab: PlanningTab | undefined) {
  if (!tab) {
    return false;
  }

  return tab.readOnly === true || isGeneratedGraphTab(tab);
}

export function isTabLayoutLocked(_project: ProjectFile, tab: PlanningTab | undefined) {
  if (!tab) {
    return false;
  }

  if (isGeneratedGraphTab(tab)) {
    return false;
  }

  return tab.readOnly === true;
}
