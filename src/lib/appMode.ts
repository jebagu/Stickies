export type AppViewMode = "editor" | "public";

export function getAppViewMode(pathname = window.location.pathname): AppViewMode {
  return pathname.replace(/\/+$/, "").endsWith("/public") ? "public" : "editor";
}

export function isPublicViewMode(viewMode: AppViewMode) {
  return viewMode === "public";
}

export function getPublicProjectUrl() {
  return `${import.meta.env.BASE_URL}public/project.json`;
}
