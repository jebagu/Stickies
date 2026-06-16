import type { ProjectFile } from "../../types/planning";
import { createProjectJson } from "../exportImport";
import { STICKIES_DRIVE_MIME, STICKIES_FILE_SUFFIX } from "./config";

const DRIVE_API_BASE_URL = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD_BASE_URL = "https://www.googleapis.com/upload/drive/v3";
const DRIVE_FILE_FIELDS = [
  "id",
  "name",
  "mimeType",
  "modifiedTime",
  "version",
  "webViewLink",
  "capabilities/canEdit",
  "capabilities/canShare",
  "capabilities/canDownload",
].join(",");

export type DriveFileMetadata = {
  id: string;
  name: string;
  mimeType?: string;
  modifiedTime?: string;
  version?: string;
  webViewLink?: string;
  capabilities?: {
    canEdit?: boolean;
    canShare?: boolean;
    canDownload?: boolean;
  };
};

export type DriveCloudFile = {
  id: string;
  name: string;
  mimeType?: string;
  modifiedTime?: string;
  version?: string;
  webViewLink?: string;
  canEdit: boolean;
  canShare: boolean;
  canDownload: boolean;
};

export class DriveAuthError extends Error {
  constructor(message = "Google Drive authorization expired.") {
    super(message);
    this.name = "DriveAuthError";
  }
}

export function isDriveAuthError(error: unknown): error is DriveAuthError {
  return error instanceof DriveAuthError;
}

export function toDriveCloudFile(metadata: DriveFileMetadata): DriveCloudFile {
  return {
    id: metadata.id,
    name: metadata.name,
    mimeType: metadata.mimeType,
    modifiedTime: metadata.modifiedTime,
    version: metadata.version,
    webViewLink: metadata.webViewLink,
    canEdit: metadata.capabilities?.canEdit === true,
    canShare: metadata.capabilities?.canShare === true,
    canDownload: metadata.capabilities?.canDownload !== false,
  };
}

function assertMetadata(value: unknown): DriveFileMetadata {
  const metadata = value as Partial<DriveFileMetadata>;

  if (!metadata || typeof metadata.id !== "string" || typeof metadata.name !== "string") {
    throw new Error("Google Drive returned incomplete file metadata.");
  }

  return metadata as DriveFileMetadata;
}

async function fetchDrive(url: string, accessToken: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  });

  if (response.status === 401) {
    throw new DriveAuthError();
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(errorText || `Google Drive request failed with status ${response.status}.`);
  }

  return response;
}

export async function getFileMetadata(fileId: string, accessToken: string) {
  const params = new URLSearchParams({
    fields: DRIVE_FILE_FIELDS,
    supportsAllDrives: "true",
  });
  const response = await fetchDrive(`${DRIVE_API_BASE_URL}/files/${encodeURIComponent(fileId)}?${params}`, accessToken);
  return assertMetadata(await response.json());
}

export async function downloadFileText(fileId: string, accessToken: string) {
  const params = new URLSearchParams({
    alt: "media",
    supportsAllDrives: "true",
  });
  const response = await fetchDrive(`${DRIVE_API_BASE_URL}/files/${encodeURIComponent(fileId)}?${params}`, accessToken);
  return response.text();
}

export function ensureStickiesFileName(name: string) {
  const trimmedName = name.trim() || "Stickies project";
  return trimmedName.toLowerCase().endsWith(STICKIES_FILE_SUFFIX) ? trimmedName : `${trimmedName}${STICKIES_FILE_SUFFIX}`;
}

export function createProjectUploadBody(project: ProjectFile) {
  return createProjectJson(project);
}

export { DRIVE_API_BASE_URL, DRIVE_UPLOAD_BASE_URL, DRIVE_FILE_FIELDS, STICKIES_DRIVE_MIME };
