import { GOOGLE_DRIVE_SCOPE, assertGoogleDriveConfigured, getGoogleDriveConfig } from "./config";
import { loadScript } from "../loadScript";

const GOOGLE_IDENTITY_SCRIPT_URL = "https://accounts.google.com/gsi/client";
const GOOGLE_OAUTH_REDIRECT_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const DRIVE_AUTH_PENDING_STORAGE_KEY = "project-planner:v1:pending-drive-auth";
const DRIVE_AUTH_STATE_PREFIX = "stickies-drive";
const DRIVE_AUTH_PENDING_MAX_AGE_MS = 10 * 60 * 1000;

type TokenResponse = {
  access_token?: string;
  expires_in?: number;
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
let currentAccessTokenExpiresAt = 0;
let pendingTokenRequest: Promise<string> | undefined;

export type PendingGoogleDriveAction = "save-as" | "save-existing" | "publish";

type PendingGoogleDriveAuth = {
  action: PendingGoogleDriveAction;
  createdAt: number;
  returnPath: string;
  state: string;
};

export type GoogleDriveRedirectResult =
  | {
      status: "none";
    }
  | {
      status: "ready";
      accessToken: string;
      action: PendingGoogleDriveAction;
    }
  | {
      status: "error";
      message: string;
    };

export class GoogleDrivePopupAuthError extends Error {
  constructor(message = "Google authorization popup was closed or blocked.") {
    super(message);
    this.name = "GoogleDrivePopupAuthError";
  }
}

function getGoogleIdentity() {
  return window.google as GoogleIdentityGlobal | undefined;
}

function isBrowser() {
  return typeof window !== "undefined";
}

function getTokenExpiresAt(expiresInSeconds: number | undefined) {
  if (!expiresInSeconds || Number.isNaN(expiresInSeconds)) {
    return Date.now() + 55 * 60 * 1000;
  }

  return Date.now() + Math.max(0, expiresInSeconds - 60) * 1000;
}

function toGoogleAuthorizationError(error: unknown) {
  const errorText =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : JSON.stringify(error) ?? "";
  const lowerErrorText = errorText.toLowerCase();

  if (
    lowerErrorText.includes("popup") ||
    lowerErrorText.includes("unknown") ||
    lowerErrorText.includes("gsi_logger")
  ) {
    return new GoogleDrivePopupAuthError(
      "Google authorization popup was closed or blocked. Stickies will finish authorization in this browser tab instead.",
    );
  }

  return error instanceof Error ? error : new Error("Google authorization failed.");
}

function createOpaqueState() {
  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);
  const randomPart = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${DRIVE_AUTH_STATE_PREFIX}:${randomPart}`;
}

function getGoogleDriveRedirectUri() {
  if (!isBrowser()) {
    return "";
  }

  return new URL(import.meta.env.BASE_URL || "/", window.location.origin).toString();
}

function readPendingGoogleDriveAuth(): PendingGoogleDriveAuth | undefined {
  if (!isBrowser()) {
    return undefined;
  }

  const rawValue = window.sessionStorage.getItem(DRIVE_AUTH_PENDING_STORAGE_KEY);
  if (!rawValue) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<PendingGoogleDriveAuth>;
    if (
      (parsed.action !== "save-as" && parsed.action !== "save-existing" && parsed.action !== "publish") ||
      typeof parsed.createdAt !== "number" ||
      typeof parsed.returnPath !== "string" ||
      typeof parsed.state !== "string"
    ) {
      return undefined;
    }

    if (Date.now() - parsed.createdAt > DRIVE_AUTH_PENDING_MAX_AGE_MS) {
      return undefined;
    }

    return parsed as PendingGoogleDriveAuth;
  } catch {
    return undefined;
  }
}

function clearPendingGoogleDriveAuth() {
  if (!isBrowser()) {
    return;
  }

  window.sessionStorage.removeItem(DRIVE_AUTH_PENDING_STORAGE_KEY);
}

function clearOAuthHash() {
  if (!isBrowser() || !window.location.hash) {
    return;
  }

  const cleanUrl = `${window.location.pathname}${window.location.search}`;
  window.history.replaceState(null, document.title, cleanUrl);
}

export function isGoogleDriveRedirectFallbackError(error: unknown) {
  return error instanceof GoogleDrivePopupAuthError;
}

export function setGoogleDriveAccessToken(accessToken: string, expiresInSeconds?: number) {
  currentAccessToken = accessToken;
  currentAccessTokenExpiresAt = getTokenExpiresAt(expiresInSeconds);
}

export function hasUsableGoogleDriveAccessToken() {
  return Boolean(currentAccessToken && currentAccessTokenExpiresAt > Date.now());
}

async function getTokenClient() {
  const config = assertGoogleDriveConfigured();

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
  if (currentAccessToken && currentAccessTokenExpiresAt > Date.now() && !options.forcePrompt) {
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

            setGoogleDriveAccessToken(response.access_token, response.expires_in);
            resolve(response.access_token);
          },
          error_callback: (error) => {
            pendingTokenRequest = undefined;
            reject(toGoogleAuthorizationError(error));
          },
        });

        tokenClient.requestAccessToken({ prompt: options.forcePrompt ? "consent" : currentAccessToken ? "" : "select_account" });
      })
      .catch((error: unknown) => {
        pendingTokenRequest = undefined;
        reject(toGoogleAuthorizationError(error));
      });
  });

  return pendingTokenRequest;
}

export function beginGoogleDriveRedirectAuthorization(action: PendingGoogleDriveAction): never {
  const config = assertGoogleDriveConfigured();
  const state = createOpaqueState();
  const redirectUri = getGoogleDriveRedirectUri();

  window.sessionStorage.setItem(
    DRIVE_AUTH_PENDING_STORAGE_KEY,
    JSON.stringify({
      action,
      createdAt: Date.now(),
      returnPath: `${window.location.pathname}${window.location.search}`,
      state,
    } satisfies PendingGoogleDriveAuth),
  );

  const authUrl = new URL(GOOGLE_OAUTH_REDIRECT_URL);
  authUrl.searchParams.set("client_id", config.clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "token");
  authUrl.searchParams.set("scope", GOOGLE_DRIVE_SCOPE);
  authUrl.searchParams.set("include_granted_scopes", "true");
  authUrl.searchParams.set("prompt", "select_account");
  authUrl.searchParams.set("state", state);

  window.location.assign(authUrl.toString());
  throw new Error("Redirecting to Google authorization.");
}

export function consumeGoogleDriveRedirectResult(): GoogleDriveRedirectResult {
  if (!isBrowser() || !window.location.hash) {
    return { status: "none" };
  }

  const hashParams = new URLSearchParams(window.location.hash.slice(1));
  const accessToken = hashParams.get("access_token");
  const error = hashParams.get("error");
  const state = hashParams.get("state");

  if (!accessToken && !error) {
    return { status: "none" };
  }

  const pendingAuth = readPendingGoogleDriveAuth();
  clearOAuthHash();
  clearPendingGoogleDriveAuth();

  if (!pendingAuth || !state || state !== pendingAuth.state) {
    return {
      status: "error",
      message: "Google authorization returned without a matching Stickies Drive request. Please retry the Drive action.",
    };
  }

  if (error) {
    return {
      status: "error",
      message: hashParams.get("error_description") || error,
    };
  }

  if (!accessToken) {
    return {
      status: "error",
      message: "Google authorization did not return an access token. Please retry the Drive action.",
    };
  }

  const expiresIn = Number(hashParams.get("expires_in") ?? "");
  setGoogleDriveAccessToken(accessToken, Number.isNaN(expiresIn) ? undefined : expiresIn);

  return {
    status: "ready",
    accessToken,
    action: pendingAuth.action,
  };
}

export function forgetGoogleDriveAccessToken() {
  currentAccessToken = undefined;
  currentAccessTokenExpiresAt = 0;
}
