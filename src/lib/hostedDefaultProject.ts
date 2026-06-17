import { createBlankProject } from "../data/seedProject";
import type { ProjectFile } from "../types/planning";
import { validateProjectFile } from "./validation";

export type LoadHostedDefaultProjectResult = {
  project: ProjectFile;
  warning?: string;
};

function getBaseUrl() {
  return import.meta.env?.BASE_URL ?? "/Stickies/";
}

export function getHostedDefaultProjectUrl() {
  return `${getBaseUrl()}welcome-to-stickies.stickies`;
}

export async function loadHostedDefaultProject(): Promise<LoadHostedDefaultProjectResult> {
  try {
    const response = await fetch(getHostedDefaultProjectUrl(), {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Welcome project could not be loaded (${response.status}).`);
    }

    const parsed = (await response.json()) as unknown;
    const validation = validateProjectFile(parsed);

    if (!validation.ok) {
      return {
        project: createBlankProject(),
        warning: `Welcome project is invalid. ${validation.errors.join(" ")}`,
      };
    }

    return {
      project: validation.project,
    };
  } catch (error) {
    return {
      project: createBlankProject(),
      warning: `${error instanceof Error ? error.message : "Welcome project could not be loaded."} Showing a blank project instead.`,
    };
  }
}
