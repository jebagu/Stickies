import { createSeedProject } from "../data/seedProject";
import type { DriveCloudFile } from "./googleDrive/driveClient";
import type { ProjectFile } from "../types/planning";
import { validateProjectFile } from "./validation";

export const CURRENT_PROJECT_STORAGE_KEY = "project-planner:v1:current";
export const LAST_OPENED_STORAGE_KEY = "project-planner:v1:last-opened";
export const CURRENT_DRIVE_FILE_STORAGE_KEY = "project-planner:v1:current-drive-file";

const DEFAULT_PROJECT_NAMES_TO_NORMALIZE = new Set(["Sonic Sphere Project Planner", "Stickies - Sonic Sphere"]);
const CURRENT_DEFAULT_PROJECT_NAME = "Stickies";

export type LoadProjectResult = {
  project: ProjectFile;
  source: "localStorage" | "seed";
  warning?: string;
};

type StoredDriveFile = {
  projectCreatedAt: string;
  file: DriveCloudFile;
};

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function normalizeLoadedProjectName(project: ProjectFile): ProjectFile {
  if (!DEFAULT_PROJECT_NAMES_TO_NORMALIZE.has(project.projectName)) {
    return project;
  }

  return {
    ...project,
    projectName: CURRENT_DEFAULT_PROJECT_NAME,
  };
}

export function loadProjectFromStorage(): LoadProjectResult {
  if (!canUseLocalStorage()) {
    return {
      project: createSeedProject(),
      source: "seed",
      warning: "localStorage is not available in this environment.",
    };
  }

  const savedProject = window.localStorage.getItem(CURRENT_PROJECT_STORAGE_KEY);

  if (!savedProject) {
    return {
      project: createSeedProject(),
      source: "seed",
    };
  }

  try {
    const parsed = JSON.parse(savedProject) as unknown;
    const validation = validateProjectFile(parsed);

    if (!validation.ok) {
      return {
        project: createSeedProject(),
        source: "seed",
        warning: validation.errors.join(" "),
      };
    }

    window.localStorage.setItem(LAST_OPENED_STORAGE_KEY, new Date().toISOString());

    return {
      project: normalizeLoadedProjectName(validation.project),
      source: "localStorage",
    };
  } catch (error) {
    return {
      project: createSeedProject(),
      source: "seed",
      warning: error instanceof Error ? error.message : "Saved project JSON could not be parsed.",
    };
  }
}

export function saveProjectToStorage(project: ProjectFile) {
  if (!canUseLocalStorage()) {
    throw new Error("localStorage is not available in this environment.");
  }

  window.localStorage.setItem(CURRENT_PROJECT_STORAGE_KEY, JSON.stringify(project));
  window.localStorage.setItem(LAST_OPENED_STORAGE_KEY, new Date().toISOString());
}

export function clearProjectStorage() {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.removeItem(CURRENT_PROJECT_STORAGE_KEY);
  window.localStorage.removeItem(LAST_OPENED_STORAGE_KEY);
}

export function saveDriveFileToStorage(file: DriveCloudFile, project: ProjectFile) {
  if (!canUseLocalStorage()) {
    return;
  }

  const storedDriveFile: StoredDriveFile = {
    projectCreatedAt: project.createdAt,
    file,
  };

  window.localStorage.setItem(CURRENT_DRIVE_FILE_STORAGE_KEY, JSON.stringify(storedDriveFile));
}

export function loadDriveFileFromStorage(project: ProjectFile) {
  if (!canUseLocalStorage()) {
    return undefined;
  }

  const savedDriveFile = window.localStorage.getItem(CURRENT_DRIVE_FILE_STORAGE_KEY);

  if (!savedDriveFile) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(savedDriveFile) as Partial<StoredDriveFile>;
    const file = parsed.file;

    if (
      parsed.projectCreatedAt !== project.createdAt ||
      !file ||
      typeof file.id !== "string" ||
      typeof file.name !== "string"
    ) {
      clearDriveFileStorage();
      return undefined;
    }

    return file;
  } catch {
    clearDriveFileStorage();
    return undefined;
  }
}

export function clearDriveFileStorage() {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.removeItem(CURRENT_DRIVE_FILE_STORAGE_KEY);
}
