import type { DriveCloudFile } from "./driveClient";

export const DRIVE_RECENTS_STORAGE_KEY = "project-planner:v1:drive-recents";
export const MAX_DRIVE_RECENTS = 10;

export type DriveRecentFile = {
  id: string;
  name: string;
  folderName?: string;
  modifiedTime?: string;
  webViewLink?: string;
  lastOpenedAt: string;
};

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isRecentFile(value: unknown): value is DriveRecentFile {
  const candidate = value as Partial<DriveRecentFile>;
  return Boolean(candidate && typeof candidate.id === "string" && typeof candidate.name === "string");
}

export function loadDriveRecentFiles() {
  if (!canUseLocalStorage()) {
    return [];
  }

  try {
    const savedRecents = window.localStorage.getItem(DRIVE_RECENTS_STORAGE_KEY);
    const parsed = savedRecents ? (JSON.parse(savedRecents) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter(isRecentFile).slice(0, MAX_DRIVE_RECENTS) : [];
  } catch {
    return [];
  }
}

function saveDriveRecentFiles(recents: DriveRecentFile[]) {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(DRIVE_RECENTS_STORAGE_KEY, JSON.stringify(recents.slice(0, MAX_DRIVE_RECENTS)));
}

export function rememberDriveRecentFile(file: DriveCloudFile, openedAt = new Date().toISOString()) {
  const recentFile: DriveRecentFile = {
    id: file.id,
    name: file.name,
    folderName: file.folderName,
    modifiedTime: file.modifiedTime,
    webViewLink: file.webViewLink,
    lastOpenedAt: openedAt,
  };
  const dedupedRecents = loadDriveRecentFiles().filter((recent) => recent.id !== file.id);
  saveDriveRecentFiles([recentFile, ...dedupedRecents]);
}

export function forgetDriveRecentFile(fileId: string) {
  saveDriveRecentFiles(loadDriveRecentFiles().filter((recent) => recent.id !== fileId));
}
