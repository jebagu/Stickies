import { GOOGLE_DRIVE_MISSING_CONFIG_MESSAGE, GOOGLE_DRIVE_SCOPE, getGoogleDriveConfig } from "./config";
import { loadScript } from "../loadScript";

const GOOGLE_IDENTITY_SCRIPT_URL = "https://accounts.google.com/gsi/client";

type TokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type TokenClient = {
  requestAccessToken: (options?: { prompt?: "" | "consent" | "select_account" }) => void;
};

type TokenClientConfig = {
  client_id: string;
  scope: string;
  callback: (response: TokenResponse) => void;
  error_callback?: (error: unknown) => void;
};

type GoogleIdentityGlobal = {
  accounts?: {
    oauth2?: {
      initTokenClient: (config: TokenClientConfig) => TokenClient;
    };
  };
};

let tokenClient: TokenClient | undefined;
let currentAccessToken: string | undefined;
let pendingTokenRequest: Promise<string> | undefined;

function getGoogleIdentity() {
  return window.google as GoogleIdentityGlobal | undefined;
}

async function getTokenClient() {
  const config = getGoogleDriveConfig();

  if (!config.clientId || !config.apiKey || !config.appId) {
    throw new Error(GOOGLE_DRIVE_MISSING_CONFIG_MESSAGE);
  }

  await loadScript(GOOGLE_IDENTITY_SCRIPT_URL);

  const googleIdentity = getGoogleIdentity();
  const initTokenClient = googleIdentity?.accounts?.oauth2?.initTokenClient;

  if (!initTokenClient) {
    throw new Error("Google Identity Services did not load. Check the browser console and Google Cloud setup.");
  }

  if (!tokenClient) {
    tokenClient = initTokenClient({
      client_id: config.clientId,
      scope: GOOGLE_DRIVE_SCOPE,
      callback: () => undefined,
    });
  }

  return tokenClient;
}

export async function getGoogleDriveAccessToken(options: { forcePrompt?: boolean } = {}) {
  if (currentAccessToken && !options.forcePrompt) {
    return currentAccessToken;
  }

  if (pendingTokenRequest) {
    return pendingTokenRequest;
  }

  pendingTokenRequest = new Promise<string>((resolve, reject) => {
    void getTokenClient()
      .then((client) => {
        const googleIdentity = getGoogleIdentity();
        const initTokenClient = googleIdentity?.accounts?.oauth2?.initTokenClient;
        const config = getGoogleDriveConfig();

        if (!initTokenClient) {
          reject(new Error("Google Identity Services did not load. Check the browser console and Google Cloud setup."));
          return;
        }

        tokenClient = initTokenClient({
          client_id: config.clientId,
          scope: GOOGLE_DRIVE_SCOPE,
          callback: (response) => {
            pendingTokenRequest = undefined;

            if (response.error) {
              reject(new Error(response.error_description || response.error));
              return;
            }

            if (!response.access_token) {
              reject(new Error("Google did not return an access token."));
              return;
            }

            currentAccessToken = response.access_token;
            resolve(response.access_token);
          },
          error_callback: (error) => {
            pendingTokenRequest = undefined;
            reject(error instanceof Error ? error : new Error("Google authorization failed."));
          },
        });

        tokenClient.requestAccessToken({ prompt: options.forcePrompt ? "consent" : "" });
      })
      .catch((error: unknown) => {
        pendingTokenRequest = undefined;
        reject(error instanceof Error ? error : new Error("Google authorization failed."));
      });
  });

  return pendingTokenRequest;
}

export function forgetGoogleDriveAccessToken() {
  currentAccessToken = undefined;
}
