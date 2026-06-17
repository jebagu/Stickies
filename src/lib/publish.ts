import type { ProjectFile } from "../types/planning";
import { getPublicProjectUrl } from "./appMode";
import { getGoogleDriveConfig } from "./googleDrive/config";
import {
  createPublishedStickiesDriveFile,
  publishDriveFileForAnyone,
  toDriveCloudFile,
  type DriveCloudFile,
} from "./googleDrive/driveClient";

export type DrivePublishResult = {
  file: DriveCloudFile;
  publicUrl: string;
};

const DRIVE_API_BASE_URL = "https://www.googleapis.com/drive/v3";
const DEFAULT_PUBLIC_APP_ORIGIN = "https://jebagu.github.io";
const LOCAL_HOSTNAMES = new Set(["127.0.0.1", "localhost", "::1"]);

export function createPublishedProject(project: ProjectFile): ProjectFile {
  return {
    ...project,
    snapshots: [],
    updatedAt: new Date().toISOString(),
  };
}

export function getPublishedProjectJsonUrl(slug: string) {
  return `${import.meta.env.BASE_URL}published/${slug}.json`;
}

export function getPublicDriveProjectUrl(fileId: string) {
  const encodedFileId = encodeURIComponent(fileId);
  return new URL(`${import.meta.env.BASE_URL}public/drive/${encodedFileId}/`, getPublicAppOrigin()).toString();
}

function getPublicAppOrigin() {
  const configuredOrigin = import.meta.env.VITE_PUBLIC_APP_ORIGIN?.trim();

  if (configuredOrigin) {
    return configuredOrigin;
  }

  if (LOCAL_HOSTNAMES.has(window.location.hostname)) {
    return DEFAULT_PUBLIC_APP_ORIGIN;
  }

  return window.location.origin;
}

export function getPublicDriveProjectApiUrl(fileId: string) {
  const config = getGoogleDriveConfig();
  const params = new URLSearchParams({
    alt: "media",
    key: config.apiKey,
    supportsAllDrives: "true",
  });

  return `${DRIVE_API_BASE_URL}/files/${encodeURIComponent(fileId)}?${params}`;
}

export async function downloadPublishedDriveProject(fileId: string) {
  const response = await fetch(getPublicDriveProjectApiUrl(fileId), {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Public Drive snapshot could not be loaded (${response.status}).`);
  }

  return (await response.json()) as unknown;
}

export async function publishProjectSnapshotToDrive(args: {
  accessToken: string;
  name: string;
  folderId?: string;
  project: ProjectFile;
}): Promise<DrivePublishResult> {
  const publishedProject = createPublishedProject(args.project);
  const metadata = await createPublishedStickiesDriveFile(args.accessToken, args.name, publishedProject, args.folderId);
  const file = toDriveCloudFile(metadata);

  try {
    await publishDriveFileForAnyone(args.accessToken, file.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Google Drive blocked public link sharing.";
    const driveLink = file.webViewLink ? `\n\nDrive file:\n${file.webViewLink}` : "";

    throw new Error(
      `Snapshot was saved to Google Drive, but Stickies could not make it public by link. ${message}${driveLink}`,
    );
  }

  return {
    file,
    publicUrl: getPublicDriveProjectUrl(file.id),
  };
}

export { getPublicProjectUrl };
