import { customAlphabet } from "nanoid";
import type { ProjectFile } from "../types/planning";
import { createProjectJson } from "./exportImport";

const GITHUB_OWNER = "jebagu";
const GITHUB_REPO = "Stickies";
const GITHUB_BRANCH = "main";
const GITHUB_API_VERSION = "2022-11-28";
const GITHUB_PAGES_ORIGIN = "https://jebagu.github.io";
const MAX_PUBLISH_ATTEMPTS = 5;
export const GITHUB_PUBLISH_TOKEN_STORAGE_KEY = "stickies:github-publish-token";

const createSlug = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 10);

export function createPublishSlug() {
  return createSlug();
}

export function createPublishedProject(project: ProjectFile): ProjectFile {
  return {
    ...structuredClone(project),
    snapshots: [],
  };
}

export function getPublishedProjectUrl(slug: string) {
  return new URL(`${import.meta.env.BASE_URL}public/${slug}/`, GITHUB_PAGES_ORIGIN).toString();
}

export function getPublishedProjectJsonUrl(slug: string) {
  return `${import.meta.env.BASE_URL}published/${slug}.json`;
}

export function getPublishedProjectTargetPath(slug: string) {
  return `public/published/${slug}.json`;
}

export function getSavedGitHubPublishToken() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(GITHUB_PUBLISH_TOKEN_STORAGE_KEY) ?? "";
}

export function saveGitHubPublishToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(GITHUB_PUBLISH_TOKEN_STORAGE_KEY, token);
}

function toBase64(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

async function readGitHubError(response: Response) {
  try {
    const parsed = (await response.json()) as { message?: string };
    return parsed.message ?? `GitHub returned ${response.status}.`;
  } catch {
    return `GitHub returned ${response.status}.`;
  }
}

async function createPublishedFile(project: ProjectFile, token: string, slug: string) {
  const path = getPublishedProjectTargetPath(slug);
  const response = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`, {
    method: "PUT",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": GITHUB_API_VERSION,
    },
    body: JSON.stringify({
      branch: GITHUB_BRANCH,
      content: toBase64(createProjectJson(createPublishedProject(project))),
      message: `Publish snapshot ${slug}`,
    }),
  });

  if (response.ok) {
    return;
  }

  throw new Error(await readGitHubError(response));
}

export async function publishProjectToGitHub(project: ProjectFile, token: string) {
  let lastError = "";

  for (let attempt = 0; attempt < MAX_PUBLISH_ATTEMPTS; attempt += 1) {
    const slug = createPublishSlug();

    try {
      await createPublishedFile(project, token, slug);
      return {
        slug,
        publicUrl: getPublishedProjectUrl(slug),
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : "GitHub publish failed.";

      if (!lastError.includes("sha") && !lastError.includes("already exists")) {
        throw new Error(lastError);
      }
    }
  }

  throw new Error(lastError || "Could not create a unique published snapshot slug.");
}
