import type { ProjectFile } from "../../types/planning";
import { createProjectJson } from "../exportImport";
import { createStickiesFileName } from "../stickiesFiles";
import { STICKIES_DRIVE_MIME } from "./config";

const DRIVE_API_BASE_URL = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD_BASE_URL = "https://www.googleapis.com/upload/drive/v3";
const DRIVE_FOLDER_MIME = "application/vnd.google-apps.folder";
const STICKIES_DRIVE_FOLDER_NAME = "Stickies";
const DRIVE_FILE_FIELDS = [
  "id",
  "name",
  "mimeType",
  "modifiedTime",
  "trashed",
  "version",
  "webViewLink",
  "appProperties",
  "capabilities/canEdit",
  "capabilities/canShare",
  "capabilities/canDownload",
].join(",");

export type DriveFileMetadata = {
  id: string;
  name: string;
  mimeType?: string;
  modifiedTime?: string;
  trashed?: boolean;
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
  folderName?: string;
  mimeType?: string;
  modifiedTime?: string;
  version?: string;
  webViewLink?: string;
  canEdit: boolean;
  canShare: boolean;
  canDownload: boolean;
};

export type DriveFolderPick = {
  id?: string;
  name: string;
  url?: string;
};

export type ExistingStickiesDriveFolder = {
  folder: DriveFileMetadata;
  matchCount: number;
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

export function toDriveCloudFile(metadata: DriveFileMetadata, options: { folderName?: string } = {}): DriveCloudFile {
  return {
    id: metadata.id,
    name: metadata.name,
    folderName: options.folderName,
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

async function createDriveFileMetadata(accessToken: string, metadata: Record<string, unknown>) {
  const params = new URLSearchParams({
    fields: DRIVE_FILE_FIELDS,
    supportsAllDrives: "true",
  });
  const response = await fetchDrive(`${DRIVE_API_BASE_URL}/files?${params}`, accessToken, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify(metadata),
  });

  return assertMetadata(await response.json());
}

async function patchDriveFileMetadata(accessToken: string, fileId: string, metadata: Record<string, unknown>) {
  const params = new URLSearchParams({
    fields: DRIVE_FILE_FIELDS,
    supportsAllDrives: "true",
  });
  const response = await fetchDrive(`${DRIVE_API_BASE_URL}/files/${encodeURIComponent(fileId)}?${params}`, accessToken, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify(metadata),
  });

  return assertMetadata(await response.json());
}

async function uploadDriveFileText(accessToken: string, fileId: string, fileText: string) {
  const params = new URLSearchParams({
    uploadType: "media",
    fields: DRIVE_FILE_FIELDS,
    supportsAllDrives: "true",
  });
  const response = await fetchDrive(`${DRIVE_UPLOAD_BASE_URL}/files/${encodeURIComponent(fileId)}?${params}`, accessToken, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: fileText,
  });

  return assertMetadata(await response.json());
}

async function uploadDriveFileContent(accessToken: string, fileId: string, project: ProjectFile) {
  return uploadDriveFileText(accessToken, fileId, createProjectUploadBody(project));
}

export async function createStickiesDriveFile(
  accessToken: string,
  name: string,
  project: ProjectFile,
  folderId?: string,
) {
  const metadata = {
    name: ensureStickiesFileName(name),
    mimeType: STICKIES_DRIVE_MIME,
    ...(folderId ? { parents: [folderId] } : {}),
    appProperties: {
      app: "stickies",
      schemaVersion: String(project.schemaVersion),
    },
  };
  const createdFile = await createDriveFileMetadata(accessToken, metadata);
  return uploadDriveFileContent(accessToken, createdFile.id, project);
}

export async function createStickiesDriveFolder(accessToken: string) {
  const metadata = {
    name: STICKIES_DRIVE_FOLDER_NAME,
    mimeType: DRIVE_FOLDER_MIME,
    appProperties: {
      app: "stickies",
      purpose: "project-folder",
    },
  };

  return createDriveFileMetadata(accessToken, metadata);
}

function choosePreferredStickiesFolder(folders: DriveFileMetadata[]) {
  return [...folders].sort((leftFolder, rightFolder) => {
    const leftExactName = leftFolder.name === STICKIES_DRIVE_FOLDER_NAME ? 1 : 0;
    const rightExactName = rightFolder.name === STICKIES_DRIVE_FOLDER_NAME ? 1 : 0;

    if (leftExactName !== rightExactName) {
      return rightExactName - leftExactName;
    }

    const leftCreatedByStickies = leftFolder.appProperties?.app === "stickies" ? 1 : 0;
    const rightCreatedByStickies = rightFolder.appProperties?.app === "stickies" ? 1 : 0;

    if (leftCreatedByStickies !== rightCreatedByStickies) {
      return rightCreatedByStickies - leftCreatedByStickies;
    }

    return (rightFolder.modifiedTime ?? "").localeCompare(leftFolder.modifiedTime ?? "");
  })[0];
}

export async function findExistingStickiesDriveFolder(
  accessToken: string,
): Promise<ExistingStickiesDriveFolder | undefined> {
  const params = new URLSearchParams({
    fields: `files(${DRIVE_FILE_FIELDS})`,
    pageSize: "10",
    q: [
      `mimeType = '${DRIVE_FOLDER_MIME}'`,
      "trashed = false",
      "'root' in parents",
      `(appProperties has { key='app' and value='stickies' } or name = '${STICKIES_DRIVE_FOLDER_NAME}' or name = 'stickies')`,
    ].join(" and "),
    spaces: "drive",
    supportsAllDrives: "true",
  });
  const response = await fetchDrive(`${DRIVE_API_BASE_URL}/files?${params}`, accessToken);
  const data = (await response.json()) as { files?: unknown };
  const folders = Array.isArray(data.files) ? data.files.map(assertMetadata).filter((folder) => !folder.trashed) : [];
  const folder = choosePreferredStickiesFolder(folders);

  return folder
    ? {
        folder,
        matchCount: folders.length,
      }
    : undefined;
}

export async function validateStickiesDriveFolder(accessToken: string, folderId: string) {
  const metadata = await getFileMetadata(folderId, accessToken);

  if (metadata.mimeType !== DRIVE_FOLDER_MIME || metadata.trashed) {
    throw new Error("The saved Stickies folder is no longer available.");
  }

  return metadata;
}

export async function createPublishedStickiesDriveFile(
  accessToken: string,
  name: string,
  project: ProjectFile,
  folderId?: string,
) {
  const metadata = {
    name: ensureStickiesFileName(name),
    mimeType: STICKIES_DRIVE_MIME,
    ...(folderId ? { parents: [folderId] } : {}),
    appProperties: {
      app: "stickies",
      purpose: "published",
      schemaVersion: String(project.schemaVersion),
    },
  };
  const createdFile = await createDriveFileMetadata(accessToken, metadata);
  return uploadDriveFileText(accessToken, createdFile.id, createProjectJson(project));
}

export async function updateStickiesDriveFile(
  accessToken: string,
  fileId: string,
  project: ProjectFile,
  expectedVersion?: string,
) {
  const currentMetadata = await getFileMetadata(fileId, accessToken);

  if (currentMetadata.capabilities?.canEdit === false) {
    throw new Error("This Google Drive file is view-only. Use Save to Google Drive to make an editable copy.");
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
  await patchDriveFileMetadata(accessToken, fileId, metadata);
  return uploadDriveFileContent(accessToken, fileId, project);
}

export function ensureStickiesFileName(name: string) {
  return createStickiesFileName(name.trim() || "Stickies project");
}

export function createProjectUploadBody(project: ProjectFile) {
  return createProjectJson(project);
}

export async function publishDriveFileForAnyone(accessToken: string, fileId: string) {
  const params = new URLSearchParams({
    fields: "id,type,role",
    supportsAllDrives: "true",
  });
  await fetchDrive(`${DRIVE_API_BASE_URL}/files/${encodeURIComponent(fileId)}/permissions?${params}`, accessToken, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({
      type: "anyone",
      role: "reader",
      allowFileDiscovery: false,
    }),
  });
}

export {
  DRIVE_API_BASE_URL,
  DRIVE_UPLOAD_BASE_URL,
  DRIVE_FILE_FIELDS,
  DRIVE_FOLDER_MIME,
  STICKIES_DRIVE_FOLDER_NAME,
  STICKIES_DRIVE_MIME,
};
