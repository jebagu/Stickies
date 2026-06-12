import { customAlphabet } from "nanoid";
import type { ProjectFile } from "../types/planning";
import { createProjectJson } from "./exportImport";

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
  return new URL(`${import.meta.env.BASE_URL}public/${slug}/`, window.location.origin).toString();
}

export function getPublishedProjectJsonUrl(slug: string) {
  return `${import.meta.env.BASE_URL}published/${slug}.json`;
}

export function getPublishedProjectTargetPath(slug: string) {
  return `public/published/${slug}.json`;
}

export function downloadPublishedProject(project: ProjectFile, slug: string) {
  const blob = new Blob([createProjectJson(createPublishedProject(project))], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = `${slug}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
