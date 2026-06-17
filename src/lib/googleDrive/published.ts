import type { ProjectFile } from "../../types/planning";
import type { DriveCloudFile } from "./driveClient";

export const DRIVE_PUBLISHED_STORAGE_KEY = "project-planner:v1:drive-published";

export type PublishedDriveSnapshot = {
  createdAt: string;
  fileId: string;
  name: string;
  projectCreatedAt: string;
  publicUrl: string;
  webViewLink?: string;
};

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isPublishedSnapshot(value: unknown): value is PublishedDriveSnapshot {
  const candidate = value as Partial<PublishedDriveSnapshot>;
  return Boolean(
    candidate &&
      typeof candidate.createdAt === "string" &&
      typeof candidate.fileId === "string" &&
      typeof candidate.name === "string" &&
      typeof candidate.projectCreatedAt === "string" &&
      typeof candidate.publicUrl === "string",
  );
}

function loadPublishedSnapshots() {
  if (!canUseLocalStorage()) {
    return [];
  }

  try {
    const savedValue = window.localStorage.getItem(DRIVE_PUBLISHED_STORAGE_KEY);
    const parsed = savedValue ? (JSON.parse(savedValue) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter(isPublishedSnapshot) : [];
  } catch {
    return [];
  }
}

function savePublishedSnapshots(snapshots: PublishedDriveSnapshot[]) {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(DRIVE_PUBLISHED_STORAGE_KEY, JSON.stringify(snapshots.slice(0, 10)));
}

export function rememberPublishedDriveSnapshot(project: ProjectFile, file: DriveCloudFile, publicUrl: string) {
  const snapshot: PublishedDriveSnapshot = {
    createdAt: new Date().toISOString(),
    fileId: file.id,
    name: file.name,
    projectCreatedAt: project.createdAt,
    publicUrl,
    webViewLink: file.webViewLink,
  };
  const otherSnapshots = loadPublishedSnapshots().filter((savedSnapshot) => savedSnapshot.fileId !== file.id);
  savePublishedSnapshots([snapshot, ...otherSnapshots]);
  return snapshot;
}

export function loadLatestPublishedDriveSnapshot(project: ProjectFile) {
  return loadPublishedSnapshots().find((snapshot) => snapshot.projectCreatedAt === project.createdAt);
}
