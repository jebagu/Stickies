import { createSeedProject } from "../data/seedProject";
import type { ProjectFile } from "../types/planning";
import { getPublicDriveFileId, getPublicProjectSlug, getPublicProjectUrl } from "./appMode";
import { downloadPublishedDriveProject, getPublishedProjectJsonUrl } from "./publish";
import { validateProjectFile } from "./validation";

export type LoadPublicProjectResult = {
  project: ProjectFile;
  warning?: string;
};

export async function loadProjectFromPublicSnapshot(): Promise<LoadPublicProjectResult> {
  const driveFileId = getPublicDriveFileId();
  if (driveFileId) {
    return loadParsedPublicProject(() => downloadPublishedDriveProject(driveFileId));
  }

  const slug = getPublicProjectSlug();
  const projectUrl = slug ? getPublishedProjectJsonUrl(slug) : getPublicProjectUrl();

  return loadParsedPublicProject(async () => {
    const response = await fetch(projectUrl, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Public project snapshot could not be loaded (${response.status}).`);
    }

    return (await response.json()) as unknown;
  });
}

async function loadParsedPublicProject(loadProject: () => Promise<unknown>): Promise<LoadPublicProjectResult> {
  try {
    const parsed = await loadProject();
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
      warning: `${error instanceof Error ? error.message : "Public project snapshot could not be loaded."} Showing seed data instead.`,
    };
  }
}
