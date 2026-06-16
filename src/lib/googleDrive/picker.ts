import { loadScript } from "../loadScript";
import { getGoogleDriveConfig, LEGACY_JSON_MIME, STICKIES_DRIVE_MIME } from "./config";

const GOOGLE_API_SCRIPT_URL = "https://apis.google.com/js/api.js";

type PickerDocument = {
  id?: string;
  name?: string;
  mimeType?: string;
  url?: string;
};

type PickerResponse = {
  action?: string;
  docs?: PickerDocument[];
};

type PickerCallback = (response: PickerResponse) => void;

type PickerBuilder = {
  addView: (view: unknown) => PickerBuilder;
  setAppId: (appId: string) => PickerBuilder;
  setDeveloperKey: (apiKey: string) => PickerBuilder;
  setOAuthToken: (accessToken: string) => PickerBuilder;
  setSelectableMimeTypes: (mimeTypes: string) => PickerBuilder;
  setCallback: (callback: PickerCallback) => PickerBuilder;
  build: () => { setVisible: (visible: boolean) => void };
};

type DocsView = {
  setIncludeFolders: (includeFolders: boolean) => DocsView;
  setSelectFolderEnabled: (selectFolderEnabled: boolean) => DocsView;
};

type GooglePickerGlobal = {
  picker?: {
    Action: {
      PICKED: string;
      CANCEL: string;
    };
    ViewId: {
      DOCS: string;
      FOLDERS: string;
    };
    DocsView: new (viewId: string) => DocsView;
    PickerBuilder: new () => PickerBuilder;
  };
};

type GapiGlobal = {
  load: (apiName: string, callbackOrOptions: (() => void) | { callback: () => void; onerror?: () => void }) => void;
};

export type DriveFilePick = {
  id: string;
  name: string;
  mimeType?: string;
  url?: string;
};

export type DriveFolderPick = {
  id: string;
  name: string;
  url?: string;
};

function getGapi() {
  return window.gapi as GapiGlobal | undefined;
}

function getGooglePicker() {
  return window.google as GooglePickerGlobal | undefined;
}

async function loadPickerApi() {
  await loadScript(GOOGLE_API_SCRIPT_URL);

  const gapi = getGapi();

  if (!gapi) {
    throw new Error("Google API client did not load. Check the browser console and Google Cloud setup.");
  }

  await new Promise<void>((resolve, reject) => {
    gapi.load("picker", {
      callback: resolve,
      onerror: () => reject(new Error("Google Picker could not be loaded.")),
    });
  });
}

function toDriveFilePick(document: PickerDocument): DriveFilePick {
  if (!document.id || !document.name) {
    throw new Error("Google Picker returned an incomplete file selection.");
  }

  return {
    id: document.id,
    name: document.name,
    mimeType: document.mimeType,
    url: document.url,
  };
}

export async function pickDriveFile(accessToken: string): Promise<DriveFilePick | null> {
  const config = getGoogleDriveConfig();

  await loadPickerApi();

  const google = getGooglePicker();
  const picker = google?.picker;

  if (!picker) {
    throw new Error("Google Picker did not load. Check the browser console and Google Cloud setup.");
  }

  return new Promise((resolve, reject) => {
    const docsView = new picker.DocsView(picker.ViewId.DOCS)
      .setIncludeFolders(true)
      .setSelectFolderEnabled(false);

    const googlePicker = new picker.PickerBuilder()
      .addView(docsView)
      .setAppId(config.appId)
      .setDeveloperKey(config.apiKey)
      .setOAuthToken(accessToken)
      .setSelectableMimeTypes(`${STICKIES_DRIVE_MIME},${LEGACY_JSON_MIME}`)
      .setCallback((response) => {
        if (response.action === picker.Action.CANCEL) {
          resolve(null);
          return;
        }

        if (response.action !== picker.Action.PICKED) {
          return;
        }

        try {
          const pickedDocument = response.docs?.[0];
          resolve(pickedDocument ? toDriveFilePick(pickedDocument) : null);
        } catch (error) {
          reject(error instanceof Error ? error : new Error("Google Picker returned an invalid selection."));
        }
      })
      .build();

    googlePicker.setVisible(true);
  });
}

export async function pickDriveFolder(accessToken: string): Promise<DriveFolderPick | null> {
  const config = getGoogleDriveConfig();

  await loadPickerApi();

  const google = getGooglePicker();
  const picker = google?.picker;

  if (!picker) {
    throw new Error("Google Picker did not load. Check the browser console and Google Cloud setup.");
  }

  return new Promise((resolve, reject) => {
    const folderView = new picker.DocsView(picker.ViewId.FOLDERS)
      .setIncludeFolders(true)
      .setSelectFolderEnabled(true);

    const googlePicker = new picker.PickerBuilder()
      .addView(folderView)
      .setAppId(config.appId)
      .setDeveloperKey(config.apiKey)
      .setOAuthToken(accessToken)
      .setCallback((response) => {
        if (response.action === picker.Action.CANCEL) {
          resolve(null);
          return;
        }

        if (response.action !== picker.Action.PICKED) {
          return;
        }

        try {
          const pickedDocument = response.docs?.[0];

          if (!pickedDocument?.id || !pickedDocument.name) {
            resolve(null);
            return;
          }

          resolve({
            id: pickedDocument.id,
            name: pickedDocument.name,
            url: pickedDocument.url,
          });
        } catch (error) {
          reject(error instanceof Error ? error : new Error("Google Picker returned an invalid folder selection."));
        }
      })
      .build();

    googlePicker.setVisible(true);
  });
}
