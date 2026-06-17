import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import {
  createProjectExportFilename,
  createProjectJson,
  parseProjectJsonFile,
  parseProjectJsonText,
} from "../src/lib/exportImport.ts";
import { isTabLayoutLocked, isTabReadOnly } from "../src/lib/generatedGraph.ts";
import {
  GOOGLE_DRIVE_SCOPE,
  getGoogleDriveConfig,
  getGoogleDriveConfigIssue,
  isGoogleDriveConfigured,
} from "../src/lib/googleDrive/config.ts";
import {
  ensureStickiesFileName,
  findExistingStickiesDriveFolder,
  type DriveCloudFile,
} from "../src/lib/googleDrive/driveClient.ts";
import {
  DRIVE_RECENTS_STORAGE_KEY,
  loadDriveRecentFiles,
  rememberDriveRecentFile,
} from "../src/lib/googleDrive/recents.ts";
import {
  DRIVE_PUBLISHED_STORAGE_KEY,
  loadLatestPublishedDriveSnapshot,
  rememberPublishedDriveSnapshot,
} from "../src/lib/googleDrive/published.ts";
import {
  STICKIES_DRIVE_FOLDER_STORAGE_KEY,
  clearStickiesDriveFolder,
  loadStickiesDriveFolder,
  saveStickiesDriveFolder,
  toStoredStickiesDriveFolder,
} from "../src/lib/googleDrive/stickiesFolder.ts";
import { getHostedDefaultProjectUrl, loadHostedDefaultProject } from "../src/lib/hostedDefaultProject.ts";
import { loadProjectFromStorage } from "../src/lib/storage.ts";
import { createFunProjectName, createStickiesFileName } from "../src/lib/stickiesFiles.ts";
import { validateProjectFile } from "../src/lib/validation.ts";
import type { ProjectFile } from "../src/types/planning.ts";

const fixturesDir = join(process.cwd(), "tests", "fixtures");

function readFixture(name: string) {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8")) as unknown;
}

function expectValidProject(name: string): ProjectFile {
  const result = validateProjectFile(readFixture(name));

  assert.equal(result.ok, true, result.ok ? "" : result.errors.join("\n"));

  return result.project;
}

function withMockLocalStorage(runTest: () => void) {
  const storage = new Map<string, string>();
  const originalWindow = globalThis.window;

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storage.set(key, value);
        },
        removeItem: (key: string) => {
          storage.delete(key);
        },
      },
    },
  });

  try {
    runTest();
  } finally {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow,
    });
  }
}

function createDriveCloudFile(id: string): DriveCloudFile {
  return {
    id,
    name: `Drive file ${id}.stickies.json`,
    modifiedTime: `2026-06-16T00:00:${id.padStart(2, "0")}.000Z`,
    version: id,
    webViewLink: `https://drive.google.com/file/d/${id}/view`,
    canEdit: true,
    canShare: true,
    canDownload: true,
  };
}

test("schema v1 fixture still imports", () => {
  const project = expectValidProject("schema-v1-project.json");

  assert.equal(project.schemaVersion, 1);
  assert.equal(project.tabs[0]?.stages.length, 0);
});

test("hosted welcome project asset is valid", () => {
  const welcomeProject = JSON.parse(
    readFileSync(join(process.cwd(), "public", "welcome-to-stickies.stickies"), "utf8"),
  ) as unknown;
  const result = validateProjectFile(welcomeProject);

  assert.equal(result.ok, true, result.ok ? "" : result.errors.join("\n"));
  assert.equal(result.project.projectName, "Daring Workshop");
  assert.equal(result.project.tabs.length, 1);
  assert.equal(result.project.tabs[0]?.nodes.length, 9);
  assert.equal(result.project.tabs[0]?.edges.length, 6);
  assert.equal(result.project.settings.themeId, "neon-dark");
});

test("hosted default project loader returns the welcome asset", async () => {
  const originalFetch = globalThis.fetch;
  const welcomeProjectText = readFileSync(join(process.cwd(), "public", "welcome-to-stickies.stickies"), "utf8");

  globalThis.fetch = async (url) => {
    assert.equal(url, getHostedDefaultProjectUrl());
    return new Response(welcomeProjectText, {
      headers: {
        "Content-Type": "application/json",
      },
      status: 200,
    });
  };

  try {
    const result = await loadHostedDefaultProject();

    assert.equal(result.warning, undefined);
    assert.equal(result.project.projectName, "Daring Workshop");
    assert.equal(result.project.tabs.length, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("hosted default project loader falls back to blank on failure", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () =>
    new Response("Not found", {
      status: 404,
    });

  try {
    const result = await loadHostedDefaultProject();

    assert.match(result.warning ?? "", /Welcome project could not be loaded/);
    assert.notEqual(result.project.projectName, "Daring Workshop");
    assert.equal(result.project.tabs.length, 1);
    assert.equal(result.project.tabs[0]?.name, "Planning");
    assert.equal(result.project.settings.themeId, "neon-dark");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("empty local storage starts a blank neon dark project", () => {
  withMockLocalStorage(() => {
    const result = loadProjectFromStorage();

    assert.equal(result.source, "seed");
    assert.equal(result.project.people.length, 0);
    assert.equal(result.project.workstreams.length, 0);
    assert.equal(result.project.tags.length, 0);
    assert.equal(result.project.tabs.length, 1);
    assert.equal(result.project.tabs[0]?.name, "Planning");
    assert.equal(result.project.settings.themeId, "neon-dark");
  });
});

test("storage loader can ignore existing local storage for a blank neon default", () => {
  withMockLocalStorage(() => {
    window.localStorage.setItem(
      "project-planner:v1:current",
      JSON.stringify({
        ...expectValidProject("schema-v1-project.json"),
        projectName: "Saved browser project",
      }),
    );

    const result = loadProjectFromStorage({ ignoreSavedProject: true });

    assert.equal(result.source, "seed");
    assert.notEqual(result.project.projectName, "Saved browser project");
    assert.equal(result.project.tabs.length, 1);
    assert.equal(result.project.tabs[0]?.name, "Planning");
    assert.equal(result.project.settings.themeId, "neon-dark");
  });
});

test("schema v2 generated fixture imports and preserves graph project fields", () => {
  const project = expectValidProject("ss-react-flow-project-v2.json");

  assert.equal(project.schemaVersion, 2);
  assert.equal(project.projectOrigin?.source, "SFW Graph Analyzer");
  assert.equal(project.graphSnapshots?.[0]?.id, "snapshot-20260615");
  assert.equal(project.softwareGraphNavigation?.defaultTabId, "tab-project-map");
});

test("schema v2 native export round-trips analyzer metadata", () => {
  const project = expectValidProject("ss-react-flow-project-v2.json");
  const exported = JSON.parse(createProjectJson(project)) as unknown;
  const result = validateProjectFile(exported);

  assert.equal(result.ok, true, result.ok ? "" : result.errors.join("\n"));

  const roundTrippedProject = result.project;
  const firstNode = roundTrippedProject.tabs[0]?.nodes[0];
  const firstEdge = roundTrippedProject.tabs[0]?.edges[0];

  assert.equal(roundTrippedProject.schemaVersion, 2);
  assert.equal(roundTrippedProject.projectOrigin?.sourcePath, "/workspace/sample-app");
  assert.equal(roundTrippedProject.graphSnapshots?.[0]?.buildIdentity, "main@abc123");
  assert.equal(roundTrippedProject.softwareGraphNavigation?.defaultTabId, "tab-project-map");
  assert.equal(firstNode?.data.softwareGraph?.sourcePath, "src/App.tsx");
  assert.equal(firstEdge?.data.softwareGraph?.edgeKind, "import");
});

test("project JSON text parser uses the shared validation path", () => {
  const projectText = JSON.stringify(readFixture("schema-v1-project.json"));
  const result = parseProjectJsonText(projectText, "schema-v1-project.json");

  assert.equal(result.ok, true, result.ok ? "" : result.error);
  assert.equal(result.project.schemaVersion, 1);
});

test("fun project names are two title-case words and can be deterministic", () => {
  const randomValues = [1 / 16, 4 / 16];
  const projectName = createFunProjectName(() => randomValues.shift() ?? 0);

  assert.equal(projectName, "Cosmic Lantern");
  assert.match(projectName, /^[A-Z][a-z]+ [A-Z][a-z]+$/);
});

test("native export filenames use project-name .stickies files", () => {
  assert.equal(createProjectExportFilename("Cosmic Lantern", "native"), "cosmic-lantern.stickies");
  assert.equal(createProjectExportFilename("Cosmic Lantern", "markdown"), "cosmic-lantern.md");
  assert.equal(createProjectExportFilename("Cosmic Lantern", "docx"), "cosmic-lantern.docx");
});

test("Stickies filenames normalize new and legacy suffixes", () => {
  assert.equal(createStickiesFileName("Venue Plan"), "venue-plan.stickies");
  assert.equal(createStickiesFileName("Venue Plan.stickies"), "venue-plan.stickies");
  assert.equal(createStickiesFileName("Venue Plan.stickies.json"), "venue-plan.stickies");
  assert.equal(createStickiesFileName("Venue Plan.json"), "venue-plan.stickies");
  assert.equal(createStickiesFileName(""), "stickies-project.stickies");
});

test("local project file parser accepts current and legacy extensions", async () => {
  const projectText = JSON.stringify(readFixture("schema-v1-project.json"));

  for (const filename of ["venue-plan.stickies", "venue-plan.json", "venue-plan.stickies.json"]) {
    const result = await parseProjectJsonFile(new File([projectText], filename, { type: "application/json" }));

    assert.equal(result.ok, true, result.ok ? "" : result.error);
    assert.equal(result.project.schemaVersion, 1);
  }
});

test("local project file parser rejects unrelated extensions with Stickies copy", async () => {
  const projectText = JSON.stringify(readFixture("schema-v1-project.json"));
  const result = await parseProjectJsonFile(new File([projectText], "venue-plan.txt", { type: "text/plain" }));

  assert.equal(result.ok, false);
  assert.equal(result.error, "Choose a Stickies project file.");
});

test("Stickies Drive filenames append the current suffix exactly once", () => {
  assert.equal(ensureStickiesFileName("Venue Plan"), "venue-plan.stickies");
  assert.equal(ensureStickiesFileName("Venue Plan.stickies"), "venue-plan.stickies");
  assert.equal(ensureStickiesFileName("Venue Plan.stickies.json"), "venue-plan.stickies");
  assert.equal(ensureStickiesFileName(""), "stickies-project.stickies");
});

test("Drive recents cap at 10 and deduplicate by file ID", () => {
  withMockLocalStorage(() => {
    for (let index = 1; index <= 11; index += 1) {
      rememberDriveRecentFile(createDriveCloudFile(String(index)), `2026-06-16T00:${String(index).padStart(2, "0")}:00.000Z`);
    }

    rememberDriveRecentFile(
      {
        ...createDriveCloudFile("5"),
        name: "Updated file 5.stickies.json",
      },
      "2026-06-16T01:00:00.000Z",
    );

    const recents = loadDriveRecentFiles();
    assert.equal(recents.length, 10);
    assert.equal(recents[0]?.id, "5");
    assert.equal(recents[0]?.name, "Updated file 5.stickies.json");
    assert.equal(recents.filter((recent) => recent.id === "5").length, 1);
    assert.ok(window.localStorage.getItem(DRIVE_RECENTS_STORAGE_KEY));
  });
});

test("Drive published snapshot helper remembers latest link for current project", () => {
  withMockLocalStorage(() => {
    const firstProject = expectValidProject("schema-v1-project.json");
    const secondProject = {
      ...firstProject,
      createdAt: "2026-06-16T12:00:00.000Z",
    };

    rememberPublishedDriveSnapshot(firstProject, createDriveCloudFile("published-1"), "https://jebagu.github.io/Stickies/public/drive/published-1/");
    rememberPublishedDriveSnapshot(secondProject, createDriveCloudFile("published-2"), "https://jebagu.github.io/Stickies/public/drive/published-2/");

    const latestFirstProjectSnapshot = loadLatestPublishedDriveSnapshot(firstProject);
    assert.equal(latestFirstProjectSnapshot?.fileId, "published-1");
    assert.equal(latestFirstProjectSnapshot?.publicUrl, "https://jebagu.github.io/Stickies/public/drive/published-1/");
    assert.ok(window.localStorage.getItem(DRIVE_PUBLISHED_STORAGE_KEY));
  });
});

test("Stickies Drive folder helper stores only folder metadata", () => {
  withMockLocalStorage(() => {
    const folder = toStoredStickiesDriveFolder(
      {
        id: "folder-1",
        name: "Stickies",
        webViewLink: "https://drive.google.com/drive/folders/folder-1",
      },
      "2026-06-17T00:00:00.000Z",
    );

    saveStickiesDriveFolder(folder);

    assert.deepEqual(loadStickiesDriveFolder(), folder);
    assert.equal(
      window.localStorage.getItem(STICKIES_DRIVE_FOLDER_STORAGE_KEY),
      JSON.stringify(folder),
    );

    clearStickiesDriveFolder();
    assert.equal(loadStickiesDriveFolder(), undefined);
  });
});

test("Stickies Drive folder helper clears malformed storage", () => {
  withMockLocalStorage(() => {
    window.localStorage.setItem(STICKIES_DRIVE_FOLDER_STORAGE_KEY, JSON.stringify({ id: "folder-1" }));

    assert.equal(loadStickiesDriveFolder(), undefined);
    assert.equal(window.localStorage.getItem(STICKIES_DRIVE_FOLDER_STORAGE_KEY), null);
  });
});

test("Stickies Drive folder lookup reuses an existing top-level folder", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    const query = url.searchParams.get("q") ?? "";

    assert.equal(url.pathname, "/drive/v3/files");
    assert.match(query, /appProperties has/);
    assert.match(query, /name = 'Stickies'/);
    assert.match(query, /name = 'stickies'/);
    assert.match(query, /'root' in parents/);
    assert.equal((init?.headers as Record<string, string> | undefined)?.Authorization, "Bearer test-token");

    return new Response(
      JSON.stringify({
        files: [
          {
            id: "folder-lowercase",
            name: "stickies",
            mimeType: "application/vnd.google-apps.folder",
            modifiedTime: "2026-06-17T10:00:00.000Z",
            trashed: false,
            webViewLink: "https://drive.google.com/drive/folders/folder-lowercase",
          },
          {
            id: "folder-stickies",
            name: "Stickies",
            mimeType: "application/vnd.google-apps.folder",
            modifiedTime: "2026-06-16T10:00:00.000Z",
            trashed: false,
            webViewLink: "https://drive.google.com/drive/folders/folder-stickies",
            appProperties: {
              app: "stickies",
              purpose: "project-folder",
            },
          },
        ],
      }),
      {
        headers: {
          "Content-Type": "application/json",
        },
        status: 200,
      },
    );
  };

  try {
    const result = await findExistingStickiesDriveFolder("test-token");

    assert.equal(result?.folder.id, "folder-stickies");
    assert.equal(result?.folder.name, "Stickies");
    assert.equal(result?.matchCount, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Google Drive config reports missing public config", () => {
  assert.deepEqual(getGoogleDriveConfig(), {
    clientId: "",
    apiKey: "",
    appId: "",
  });
  assert.equal(isGoogleDriveConfigured(), false);
  assert.match(getGoogleDriveConfigIssue() ?? "", /Google Drive is not configured/);
});

test("Google Drive config accepts web OAuth, browser API key, and numeric project number", () => {
  assert.equal(
    getGoogleDriveConfigIssue({
      clientId: "1234567890-abcdef.apps.googleusercontent.com",
      apiKey: `AIza${"a".repeat(35)}`,
      appId: "123456789012",
    }),
    undefined,
  );
});

test("Google Drive scope stays limited to drive.file", () => {
  assert.equal(GOOGLE_DRIVE_SCOPE, "https://www.googleapis.com/auth/drive.file");
  assert.doesNotMatch(GOOGLE_DRIVE_SCOPE, /metadata\.readonly|\/auth\/drive(?:\s|$)/);
});

test("Google Drive config rejects common Picker credential mixups", () => {
  assert.match(
    getGoogleDriveConfigIssue({
      clientId: "your-web-oauth-client-id",
      apiKey: `AIza${"a".repeat(35)}`,
      appId: "123456789012",
    }) ?? "",
    /looks incorrect/,
  );
  assert.match(
    getGoogleDriveConfigIssue({
      clientId: "1234567890-abcdef.apps.googleusercontent.com",
      apiKey: "1234567890-abcdef.apps.googleusercontent.com",
      appId: "123456789012",
    }) ?? "",
    /looks incorrect/,
  );
  assert.match(
    getGoogleDriveConfigIssue({
      clientId: "1234567890-abcdef.apps.googleusercontent.com",
      apiKey: `AIza${"a".repeat(35)}`,
      appId: "stickies-project",
    }) ?? "",
    /looks incorrect/,
  );
});

test("schema v2 without stages imports with normalized empty stages", () => {
  const project = expectValidProject("ss-react-flow-project-v2.json");

  assert.deepEqual(project.tabs[0]?.stages, []);
  assert.equal(project.tabs[0]?.nodes.length, 2);
  assert.equal(project.tabs[0]?.edges.length, 1);
});

test("schema v2 without settings.themeId gets the default theme and keeps analyzer settings", () => {
  const project = expectValidProject("ss-react-flow-project-v2.json");

  assert.equal(project.settings.themeId, "clean-light");
  assert.equal(project.settings.generatedSoftwareGraph, true);
  assert.equal(project.settings.readOnlyGeneratedTabs, true);
});

test("schema v2 generated node inspector can read provenance metadata", () => {
  const project = expectValidProject("ss-react-flow-project-v2.json");
  const node = project.tabs[0]?.nodes[0];
  const softwareGraph = node?.data.softwareGraph;

  assert.equal(softwareGraph?.nodeKind, "module");
  assert.equal(softwareGraph?.sourcePath, "src/App.tsx");
  assert.equal(softwareGraph?.provenance?.sourceType, "typescript-ast");
  assert.equal(softwareGraph?.provenance?.extractor, "sfw-graph-analyzer");
  assert.equal(softwareGraph?.provenance?.observedAt, "2026-06-15T00:00:00.000Z");
  assert.equal(isTabReadOnly(project, project.tabs[0]), true);
  assert.equal(isTabLayoutLocked(project, project.tabs[0]), false);
  assert.equal(
    isTabLayoutLocked({ ...project, settings: { ...project.settings, readOnlyGeneratedTabs: true } }, project.tabs[0]),
    false,
  );
});

test("invalid v2 edge endpoint is rejected", () => {
  const result = validateProjectFile(readFixture("schema-v2-invalid-edge.json"));

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /target must reference a node/);
});
