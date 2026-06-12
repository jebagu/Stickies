import type { ColorMode } from "@xyflow/react";
import type { ThemeId } from "../types/planning";

export function getReactFlowColorMode(themeId: ThemeId): ColorMode {
  return themeId === "clean-light" ? "light" : "dark";
}

export function getThemeLabel(themeId: ThemeId) {
  return themeId.replaceAll("-", " ");
}
