import {
  GOOGLE_DRIVE_PICKER_KEY_HELP_MESSAGE,
  LEGACY_JSON_MIME,
  STICKIES_DRIVE_MIME,
  STICKIES_FILE_SUFFIX,
  getGoogleDriveConfig,
  type GoogleDriveConfig,
} from "./googleDrive/config";
import { getPublicDriveProjectUrl } from "./publish";

const DRIVE_API_BASE_URL = "https://www.googleapis.com/drive/v3";
const DEFAULT_PAGE_SIZE = "100";
const LEGACY_STICKIES_FILE_SUFFIX = ".stickies.json";
const JSON_FILE_SUFFIX = ".json";

export type PublicGallerySource = {
  id: string;
  name: string;
  driveFolderId: string;
};

type PublicGalleryRegistry = {
  sources: PublicGallerySource[];
};

type PublicGalleryDriveFile = {
  id?: unknown;
  name?: unknown;
  mimeType?: unknown;
  modifiedTime?: unknown;
  webViewLink?: unknown;
};

export type PublicGalleryFile = {
  id: string;
  name: string;
  mimeType?: string;
  modifiedTime?: string;
  webViewLink?: string;
  publicUrl: string;
};

function getBaseUrl() {
  return import.meta.env?.BASE_URL ?? "/Stickies/";
}

function escapeDriveQueryValue(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function hasStringProperty<T extends string>(value: unknown, key: T): value is Record<T, string> {
  return typeof value === "object" && value !== null && typeof (value as Record<T, unknown>)[key] === "string";
}

function normalizeDriveFile(file: PublicGalleryDriveFile): PublicGalleryFile | null {
  if (typeof file.id !== "string" || typeof file.name !== "string") {
    return null;
  }

  return {
    id: file.id,
    name: file.name,
    mimeType: typeof file.mimeType === "string" ? file.mimeType : undefined,
    modifiedTime: typeof file.modifiedTime === "string" ? file.modifiedTime : undefined,
    webViewLink: typeof file.webViewLink === "string" ? file.webViewLink : undefined,
    publicUrl: getPublicDriveProjectUrl(file.id),
  };
}

export function getPublicGallerySourcesUrl() {
  return `${getBaseUrl()}published/gallery-sources.json`;
}

export function parsePublicGallerySources(input: unknown): PublicGallerySource[] {
  if (typeof input !== "object" || input === null || !Array.isArray((input as PublicGalleryRegistry).sources)) {
    throw new Error("Public gallery registry is invalid.");
  }

  const sources = (input as PublicGalleryRegistry).sources
    .map((source) => {
      if (
        typeof source !== "object" ||
        source === null ||
        !hasStringProperty(source, "id") ||
        !hasStringProperty(source, "name") ||
        !hasStringProperty(source, "driveFolderId")
      ) {
        return null;
      }

      const id = source.id.trim();
      const name = source.name.trim();
      const driveFolderId = source.driveFolderId.trim();

      if (!id || !name || !driveFolderId) {
        return null;
      }

      return {
        id,
        name,
        driveFolderId,
      };
    })
    .filter((source): source is PublicGallerySource => source !== null);

  if (sources.length === 0) {
    throw new Error("Public gallery registry does not include any usable sources.");
  }

  return sources;
}

export function createPublicGalleryFolderFilesUrl(folderId: string, apiKey: string, pageToken?: string) {
  const params = new URLSearchParams({
    key: apiKey,
    q: `'${escapeDriveQueryValue(folderId)}' in parents and trashed = false`,
    fields: "nextPageToken,files(id,name,mimeType,modifiedTime,webViewLink)",
    orderBy: "modifiedTime desc",
    pageSize: DEFAULT_PAGE_SIZE,
    supportsAllDrives: "true",
    includeItemsFromAllDrives: "true",
  });

  if (pageToken) {
    params.set("pageToken", pageToken);
  }

  return `${DRIVE_API_BASE_URL}/files?${params}`;
}

export function isPublicGalleryCompatibleFile(file: Pick<PublicGalleryFile, "name" | "mimeType">) {
  const lowerName = file.name.toLowerCase();

  return (
    file.mimeType === STICKIES_DRIVE_MIME ||
    lowerName.endsWith(STICKIES_FILE_SUFFIX) ||
    lowerName.endsWith(LEGACY_STICKIES_FILE_SUFFIX) ||
    (file.mimeType === LEGACY_JSON_MIME && lowerName.endsWith(JSON_FILE_SUFFIX))
  );
}

export function toPublicGalleryFiles(files: PublicGalleryDriveFile[]) {
  return files
    .map(normalizeDriveFile)
    .filter((file): file is PublicGalleryFile => file !== null && isPublicGalleryCompatibleFile(file))
    .sort((first, second) => (second.modifiedTime ?? "").localeCompare(first.modifiedTime ?? ""));
}

export async function loadPublicGallerySources() {
  const response = await fetch(getPublicGallerySourcesUrl(), {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Public gallery sources could not be loaded (${response.status}).`);
  }

  return parsePublicGallerySources((await response.json()) as unknown);
}

function getPublicGalleryApiKey(config: GoogleDriveConfig = getGoogleDriveConfig()) {
  if (!config.apiKey) {
    throw new Error(
      `Public Gallery needs VITE_GOOGLE_API_KEY to list public Google Drive files.\n\n${GOOGLE_DRIVE_PICKER_KEY_HELP_MESSAGE}`,
    );
  }

  return config.apiKey;
}

export async function loadPublicGalleryFiles(source: PublicGallerySource, config?: GoogleDriveConfig) {
  const apiKey = getPublicGalleryApiKey(config);
  let pageToken: string | undefined;
  const files: PublicGalleryDriveFile[] = [];

  do {
    const response = await fetch(createPublicGalleryFolderFilesUrl(source.driveFolderId, apiKey, pageToken), {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `${source.name} could not be loaded (${response.status}). Make sure the Drive folder is public and the browser API key allows the Google Drive API for this site.`,
      );
    }

    const parsed = (await response.json()) as {
      nextPageToken?: unknown;
      files?: unknown;
    };

    if (!Array.isArray(parsed.files)) {
      throw new Error(`${source.name} returned an unexpected file list.`);
    }

    files.push(...(parsed.files as PublicGalleryDriveFile[]));
    pageToken = typeof parsed.nextPageToken === "string" ? parsed.nextPageToken : undefined;
  } while (pageToken);

  return toPublicGalleryFiles(files);
}
