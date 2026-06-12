import type { Confidence, LineType, NodeStatus, Priority, ThemeId } from "../types/planning";
import { getThemeLabel } from "./theme";

export const NODE_STATUS_OPTIONS: NodeStatus[] = [
  "idea",
  "defined",
  "associated",
  "in_progress",
  "blocked",
  "ready",
  "done",
  "parked",
];

export const PRIORITY_OPTIONS: Priority[] = ["P0", "P1", "P2"];
export const CONFIDENCE_OPTIONS: Confidence[] = ["low", "medium", "high"];
export const LINE_TYPE_OPTIONS: LineType[] = ["solid", "dashed", "magic"];
export const THEME_OPTIONS: ThemeId[] = ["clean-light", "clean-dark", "neon-dark"];

export function formatOptionLabel(value: string) {
  return value.replaceAll("_", " ");
}

export function formatLineTypeLabel(value: LineType) {
  return `${formatOptionLabel(value)} line`;
}

export function formatThemeLabel(value: ThemeId) {
  return getThemeLabel(value);
}
