import { customAlphabet } from "nanoid";
import type { ProjectFile } from "../types/planning";

const GITHUB_PAGES_ORIGIN = "https://jebagu.github.io";

const createSlug = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 10);

type PublishResponse = {
  ok: boolean;
  slug?: string;
  publicUrl?: string;
  error?: string;
};

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

export async function publishProjectSnapshot(project: ProjectFile) {
  const response = await fetch(`${import.meta.env.BASE_URL}__stickies_publish`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      project: createPublishedProject(project),
    }),
  });
  const result = (await response.json().catch(() => ({
    ok: false,
    error: "Publish did not return a valid response.",
  }))) as PublishResponse;

  if (!response.ok || !result.ok || !result.slug || !result.publicUrl) {
    throw new Error(
      result.error ??
        "Publishing is only available from the local Stickies app server. Start the local app and try again.",
    );
  }

  return result;
}
