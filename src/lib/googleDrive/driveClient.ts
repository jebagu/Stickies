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
  appProperties?: Record<string, string>;
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

function createMultipartBody(metadata: Record<string, unknown>, fileText: string) {
  const boundary = `stickies_${crypto.randomUUID().replaceAll("-", "")}`;
  const body = [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    JSON.stringify(metadata),
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    fileText,
    `--${boundary}--`,
    "",
  ].join("\r\n");

  return { boundary, body };
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

export async function createStickiesDriveFile(
  accessToken: string,
  folderId: string,
  name: string,
  project: ProjectFile,
) {
  const metadata = {
    name: ensureStickiesFileName(name),
    mimeType: STICKIES_DRIVE_MIME,
    parents: [folderId],
    appProperties: {
      app: "stickies",
      schemaVersion: String(project.schemaVersion),
    },
  };
  const { boundary, body } = createMultipartBody(metadata, createProjectUploadBody(project));
  const params = new URLSearchParams({
    uploadType: "multipart",
    fields: DRIVE_FILE_FIELDS,
    supportsAllDrives: "true",
  });
  const response = await fetchDrive(`${DRIVE_UPLOAD_BASE_URL}/files?${params}`, accessToken, {
    method: "POST",
    headers: {
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body,
  });

  return assertMetadata(await response.json());
}

export async function updateStickiesDriveFile(
  accessToken: string,
  fileId: string,
  project: ProjectFile,
  expectedVersion?: string,
) {
  const currentMetadata = await getFileMetadata(fileId, accessToken);

  if (currentMetadata.capabilities?.canEdit === false) {
    throw new Error("This Google Drive file is view-only. Use Save As to Google Drive to make an editable copy.");
  }

  if (expectedVersion && currentMetadata.version && currentMetadata.version !== expectedVersion) {
    throw new Error("This Google Drive file changed outside Stickies. Open the latest Drive file or use Save As to avoid overwriting another change.");
  }

  const metadata = {
    mimeType: STICKIES_DRIVE_MIME,
    appProperties: {
      app: "stickies",
      schemaVersion: String(project.schemaVersion),
    },
  };
  const { boundary, body } = createMultipartBody(metadata, createProjectUploadBody(project));
  const params = new URLSearchParams({
    uploadType: "multipart",
    fields: DRIVE_FILE_FIELDS,
    supportsAllDrives: "true",
  });
  const response = await fetchDrive(`${DRIVE_UPLOAD_BASE_URL}/files/${encodeURIComponent(fileId)}?${params}`, accessToken, {
    method: "PATCH",
    headers: {
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body,
  });

  return assertMetadata(await response.json());
}

export function ensureStickiesFileName(name: string) {
  const trimmedName = name.trim() || "Stickies project";
  return trimmedName.toLowerCase().endsWith(STICKIES_FILE_SUFFIX) ? trimmedName : `${trimmedName}${STICKIES_FILE_SUFFIX}`;
}

export function createProjectUploadBody(project: ProjectFile) {
  return createProjectJson(project);
}

export { DRIVE_API_BASE_URL, DRIVE_UPLOAD_BASE_URL, DRIVE_FILE_FIELDS, STICKIES_DRIVE_MIME };
