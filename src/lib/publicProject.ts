import { createSeedProject } from "../data/seedProject";
import type { ProjectFile } from "../types/planning";
import { getPublicProjectSlug, getPublicProjectUrl } from "./appMode";
import { getPublishedProjectJsonUrl } from "./publish";
import { validateProjectFile } from "./validation";

export type LoadPublicProjectResult = {
  project: ProjectFile;
  warning?: string;
};

export async function loadProjectFromPublicSnapshot(): Promise<LoadPublicProjectResult> {
  const slug = getPublicProjectSlug();
  const projectUrl = slug ? getPublishedProjectJsonUrl(slug) : getPublicProjectUrl();

  try {
    const response = await fetch(projectUrl, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return {
        project: createSeedProject(),
        warning: `Public project snapshot could not be loaded (${response.status}). Showing seed data instead.`,
      };
    }

    const parsed = (await response.json()) as unknown;
    const validation = validateProjectFile(parsed);

    if (!validation.ok) {
      return {
        project: createSeedProject(),
        warning: validation.errors.join(" "),
      };
    }

    return {
      project: validation.project,
    };
  } catch (error) {
    return {
      project: createSeedProject(),
      warning: error instanceof Error ? error.message : "Public project snapshot could not be loaded.",
    };
  }
}
