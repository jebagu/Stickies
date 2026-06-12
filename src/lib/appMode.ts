export type AppViewMode = "editor" | "public";

export function getAppViewMode(pathname = window.location.pathname): AppViewMode {
  return getPublicProjectSlug(pathname) !== undefined ? "public" : "editor";
}

export function isPublicViewMode(viewMode: AppViewMode) {
  return viewMode === "public";
}

export function getPublicProjectUrl() {
  return `${import.meta.env.BASE_URL}public/project.json`;
}

export function getPublicProjectSlug(pathname = window.location.pathname) {
  const basePath = import.meta.env.BASE_URL.replace(/^\/+|\/+$/g, "");
  const pathSegments = pathname.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
  const baseSegments = basePath ? basePath.split("/") : [];
  const routeSegments = pathSegments.slice(baseSegments.length);

  if (routeSegments[0] !== "public") {
    return undefined;
  }

  return routeSegments[1] ?? "";
}
