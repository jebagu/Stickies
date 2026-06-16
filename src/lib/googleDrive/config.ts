export const GOOGLE_DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";
export const STICKIES_DRIVE_MIME = "application/vnd.jebagu.stickies+json";
export const LEGACY_JSON_MIME = "application/json";
export const STICKIES_FILE_SUFFIX = ".stickies.json";

export type GoogleDriveConfig = {
  clientId: string;
  apiKey: string;
  appId: string;
};

export const GOOGLE_DRIVE_MISSING_CONFIG_MESSAGE =
  "Google Drive is not configured. Add VITE_GOOGLE_CLIENT_ID, VITE_GOOGLE_API_KEY, and VITE_GOOGLE_APP_ID to .env.local.";

export function getGoogleDriveConfig(): GoogleDriveConfig {
  return {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ?? "",
    apiKey: import.meta.env.VITE_GOOGLE_API_KEY?.trim() ?? "",
    appId: import.meta.env.VITE_GOOGLE_APP_ID?.trim() ?? "",
  };
}

export function isGoogleDriveConfigured() {
  const config = getGoogleDriveConfig();
  return Boolean(config.clientId && config.apiKey && config.appId);
}
