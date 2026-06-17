import type { DriveFileMetadata } from "./driveClient";

export const STICKIES_DRIVE_FOLDER_STORAGE_KEY = "project-planner:v1:stickies-drive-folder";

export type StoredStickiesDriveFolder = {
  id: string;
  name: string;
  savedAt: string;
  webViewLink?: string;
};

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isStoredStickiesDriveFolder(value: unknown): value is StoredStickiesDriveFolder {
  const folder = value as Partial<StoredStickiesDriveFolder>;

  return (
    typeof folder.id === "string" &&
    typeof folder.name === "string" &&
    typeof folder.savedAt === "string" &&
    (folder.webViewLink === undefined || typeof folder.webViewLink === "string")
  );
}

export function toStoredStickiesDriveFolder(
  metadata: Pick<DriveFileMetadata, "id" | "name" | "webViewLink">,
  savedAt = new Date().toISOString(),
): StoredStickiesDriveFolder {
  return {
    id: metadata.id,
    name: metadata.name,
    savedAt,
    webViewLink: metadata.webViewLink,
  };
}

export function saveStickiesDriveFolder(folder: StoredStickiesDriveFolder) {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(STICKIES_DRIVE_FOLDER_STORAGE_KEY, JSON.stringify(folder));
}

export function loadStickiesDriveFolder() {
  if (!canUseLocalStorage()) {
    return undefined;
  }

  const savedFolder = window.localStorage.getItem(STICKIES_DRIVE_FOLDER_STORAGE_KEY);

  if (!savedFolder) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(savedFolder) as unknown;

    if (!isStoredStickiesDriveFolder(parsed)) {
      clearStickiesDriveFolder();
      return undefined;
    }

    return parsed;
  } catch {
    clearStickiesDriveFolder();
    return undefined;
  }
}

export function clearStickiesDriveFolder() {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.removeItem(STICKIES_DRIVE_FOLDER_STORAGE_KEY);
}
