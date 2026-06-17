export type AppViewMode = "editor" | "public";

export function getAppViewMode(pathname = window.location.pathname): AppViewMode {
  return getPublicProjectSlug(pathname) !== undefined || getPublicDriveFileId(pathname) !== undefined ? "public" : "editor";
}

export function isPublicViewMode(viewMode: AppViewMode) {
  return viewMode === "public";
}

export function getEditorUrl() {
  return new URL(import.meta.env.BASE_URL, window.location.origin).toString();
}

export function getPublicProjectUrl() {
  return `${import.meta.env.BASE_URL}public/project.stickies`;
}

export function getLegacyPublicProjectUrl() {
  return `${import.meta.env.BASE_URL}public/project.json`;
}

function getRouteSegments(pathname = window.location.pathname) {
  const basePath = import.meta.env.BASE_URL.replace(/^\/+|\/+$/g, "");
  const pathSegments = pathname.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
  const baseSegments = basePath ? basePath.split("/") : [];

  return pathSegments.slice(baseSegments.length);
}

export function getPublicDriveFileId(pathname = window.location.pathname) {
  const routeSegments = getRouteSegments(pathname);

  if (routeSegments[0] !== "public" || routeSegments[1] !== "drive" || !routeSegments[2]) {
    return undefined;
  }

  return decodeURIComponent(routeSegments[2]);
}

export function getPublicProjectSlug(pathname = window.location.pathname) {
  const routeSegments = getRouteSegments(pathname);

  if (routeSegments[0] !== "public") {
    return undefined;
  }

  if (routeSegments[1] === "drive") {
    return undefined;
  }

  return routeSegments[1] ?? "";
}
