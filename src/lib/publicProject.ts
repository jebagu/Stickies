import { createSeedProject } from "../data/seedProject";
import type { ProjectFile } from "../types/planning";
import { getLegacyPublicProjectUrl, getPublicDriveFileId, getPublicProjectSlug, getPublicProjectUrl } from "./appMode";
import {
  downloadPublishedDriveProject,
  getLegacyPublishedProjectJsonUrl,
  getPublishedProjectJsonUrl,
} from "./publish";
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
  const projectUrls = slug
    ? [getPublishedProjectJsonUrl(slug), getLegacyPublishedProjectJsonUrl(slug)]
    : [getPublicProjectUrl(), getLegacyPublicProjectUrl()];

  return loadParsedPublicProject(async () => {
    let lastStatus = 0;

    for (const projectUrl of projectUrls) {
      const response = await fetch(projectUrl, {
        headers: {
          Accept: "application/json",
        },
      });

      if (response.ok) {
        return (await response.json()) as unknown;
      }

      lastStatus = response.status;
    }

    throw new Error(`Public project snapshot could not be loaded (${lastStatus}).`);
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
