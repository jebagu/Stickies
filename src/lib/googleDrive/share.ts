import { loadScript } from "../loadScript";
import { getGoogleDriveConfig } from "./config";

const GOOGLE_API_SCRIPT_URL = "https://apis.google.com/js/api.js";

type ShareClient = {
  setOAuthToken: (accessToken: string) => void;
  setItemIds: (itemIds: string[]) => void;
  showSettingsDialog: () => void;
};

type GapiDriveShareGlobal = {
  load: (apiName: string, callbackOrOptions: (() => void) | { callback: () => void; onerror?: () => void }) => void;
  drive?: {
    share?: {
      ShareClient: new (appId: string) => ShareClient;
    };
  };
};

function getGapi() {
  return window.gapi as GapiDriveShareGlobal | undefined;
}

async function loadDriveShareApi() {
  await loadScript(GOOGLE_API_SCRIPT_URL);

  const gapi = getGapi();

  if (!gapi) {
    throw new Error("Google API client did not load. Check the browser console and Google Cloud setup.");
  }

  await new Promise<void>((resolve, reject) => {
    gapi.load("drive-share", {
      callback: resolve,
      onerror: () => reject(new Error("Google Drive sharing could not be loaded.")),
    });
  });
}

export async function openDriveSharingDialog(accessToken: string, fileId: string) {
  const config = getGoogleDriveConfig();
  await loadDriveShareApi();

  const shareClientConstructor = getGapi()?.drive?.share?.ShareClient;

  if (!shareClientConstructor) {
    throw new Error("Google Drive sharing did not load. Check the browser console and Google Cloud setup.");
  }

  const shareClient = new shareClientConstructor(config.appId);
  shareClient.setOAuthToken(accessToken);
  shareClient.setItemIds([fileId]);
  shareClient.showSettingsDialog();
}
