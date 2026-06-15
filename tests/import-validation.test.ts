import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { isTabLayoutLocked, isTabReadOnly } from "../src/lib/generatedGraph.ts";
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

test("schema v1 fixture still imports", () => {
  const project = expectValidProject("schema-v1-project.json");

  assert.equal(project.schemaVersion, 1);
  assert.equal(project.tabs[0]?.stages.length, 0);
});

test("schema v2 generated fixture imports and preserves graph project fields", () => {
  const project = expectValidProject("ss-react-flow-project-v2.json");

  assert.equal(project.schemaVersion, 2);
  assert.equal(project.projectOrigin?.source, "SFW Graph Analyzer");
  assert.equal(project.graphSnapshots?.[0]?.id, "snapshot-20260615");
  assert.equal(project.softwareGraphNavigation?.defaultTabId, "tab-project-map");
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
  assert.equal(isTabLayoutLocked(project, project.tabs[0]), true);
  assert.equal(
    isTabLayoutLocked({ ...project, settings: { ...project.settings, readOnlyGeneratedTabs: false } }, project.tabs[0]),
    false,
  );
});

test("invalid v2 edge endpoint is rejected", () => {
  const result = validateProjectFile(readFixture("schema-v2-invalid-edge.json"));

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /target must reference a node/);
});
