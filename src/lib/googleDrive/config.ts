export const GOOGLE_DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";
export const STICKIES_DRIVE_MIME = "application/vnd.jebagu.stickies+json";
export const LEGACY_JSON_MIME = "application/json";
export const STICKIES_FILE_SUFFIX = ".stickies";

export type GoogleDriveConfig = {
  clientId: string;
  apiKey: string;
  appId: string;
};

export const GOOGLE_DRIVE_MISSING_CONFIG_MESSAGE =
  "Google Drive is not configured. Add VITE_GOOGLE_CLIENT_ID, VITE_GOOGLE_API_KEY, and VITE_GOOGLE_APP_ID to .env.local.";

export const GOOGLE_DRIVE_INVALID_CONFIG_MESSAGE =
  "Google Drive config looks incorrect. Use a web OAuth client ID ending in .apps.googleusercontent.com, a browser API key starting with AIza, and the numeric Google Cloud project number for VITE_GOOGLE_APP_ID.";

export const GOOGLE_DRIVE_PICKER_KEY_HELP_MESSAGE =
  "If Google Picker says \"The API developer key is invalid,\" check that the Google Picker API is enabled, the API key is allowed to use it, the key allows this site's HTTP referrer, and the dev server was restarted after .env.local changed.";

const BROWSER_API_KEY_PATTERN = /^AIza[0-9A-Za-z_-]{35}$/;
const GOOGLE_CLOUD_PROJECT_NUMBER_PATTERN = /^\d{6,}$/;
const PLACEHOLDER_PATTERN = /^(your-|replace-|todo|changeme|xxx)/i;

function getViteEnv() {
  return import.meta.env ?? {};
}

export function getGoogleDriveConfig(): GoogleDriveConfig {
  const env = getViteEnv();

  return {
    clientId: env.VITE_GOOGLE_CLIENT_ID?.trim() ?? "",
    apiKey: env.VITE_GOOGLE_API_KEY?.trim() ?? "",
    appId: env.VITE_GOOGLE_APP_ID?.trim() ?? "",
  };
}

function isPlaceholderValue(value: string) {
  return PLACEHOLDER_PATTERN.test(value);
}

export function getGoogleDriveConfigIssue(config: GoogleDriveConfig = getGoogleDriveConfig()) {
  if (!config.clientId || !config.apiKey || !config.appId) {
    return GOOGLE_DRIVE_MISSING_CONFIG_MESSAGE;
  }

  if ([config.clientId, config.apiKey, config.appId].some(isPlaceholderValue)) {
    return GOOGLE_DRIVE_INVALID_CONFIG_MESSAGE;
  }

  if (!config.clientId.endsWith(".apps.googleusercontent.com")) {
    return GOOGLE_DRIVE_INVALID_CONFIG_MESSAGE;
  }

  if (!BROWSER_API_KEY_PATTERN.test(config.apiKey)) {
    return GOOGLE_DRIVE_INVALID_CONFIG_MESSAGE;
  }

  if (!GOOGLE_CLOUD_PROJECT_NUMBER_PATTERN.test(config.appId)) {
    return GOOGLE_DRIVE_INVALID_CONFIG_MESSAGE;
  }

  return undefined;
}

export function assertGoogleDriveConfigured() {
  const config = getGoogleDriveConfig();
  const issue = getGoogleDriveConfigIssue(config);

  if (issue) {
    throw new Error(`${issue}\n\n${GOOGLE_DRIVE_PICKER_KEY_HELP_MESSAGE}`);
  }

  return config;
}

export function isGoogleDriveConfigured() {
  return getGoogleDriveConfigIssue() === undefined;
}
