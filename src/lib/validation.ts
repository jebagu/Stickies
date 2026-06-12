import type { ProjectFile } from "../types/planning";

const VALID_THEME_IDS = new Set(["clean-light", "clean-dark", "neon-dark"]);
const LEGACY_THEME_IDS = new Set(["react-flow-home"]);
const VALID_ASSOCIATED_ENTITY_KINDS = new Set(["person", "organization", "resource"]);

export type ValidationResult =
  | {
      ok: true;
      project: ProjectFile;
      errors: [];
    }
  | {
      ok: false;
      project?: undefined;
      errors: string[];
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateProjectFile(value: unknown): ValidationResult {
  const errors: string[] = [];

  if (!isRecord(value)) {
    return { ok: false, errors: ["Project file must be a JSON object."] };
  }

  if (value.schemaVersion !== 1) {
    errors.push("Project file must use schemaVersion 1.");
  }

  if (typeof value.projectName !== "string" || value.projectName.trim() === "") {
    errors.push("Project file must include a projectName string.");
  }

  if (!Array.isArray(value.people)) {
    errors.push("Project file must include a people array.");
  } else {
    value.people.forEach((person, index) => {
      if (!isRecord(person)) {
        errors.push(`Person or organization ${index + 1} must be an object.`);
        return;
      }

      if (typeof person.id !== "string" || person.id.trim() === "") {
        errors.push(`Person or organization ${index + 1} must include an id string.`);
      }

      if (typeof person.name !== "string" || person.name.trim() === "") {
        errors.push(`Person or organization ${index + 1} must include a name string.`);
      }

      if (typeof person.initials !== "string") {
        errors.push(`Person or organization ${index + 1} must include initials.`);
      }

      if (person.kind !== undefined && !VALID_ASSOCIATED_ENTITY_KINDS.has(String(person.kind))) {
        errors.push(`Person or organization ${index + 1} must be a person or organization.`);
      }
    });
  }

  if (!Array.isArray(value.workstreams)) {
    errors.push("Project file must include a workstreams array.");
  }

  if (!Array.isArray(value.tags)) {
    errors.push("Project file must include a tags array.");
  }

  if (!Array.isArray(value.tabs) || value.tabs.length === 0) {
    errors.push("Project file must include at least one tab.");
  } else {
    value.tabs.forEach((tab, index) => {
      if (!isRecord(tab)) {
        errors.push(`Tab ${index + 1} must be an object.`);
        return;
      }

      if (typeof tab.id !== "string" || tab.id.trim() === "") {
        errors.push(`Tab ${index + 1} must include an id string.`);
      }

      if (typeof tab.name !== "string" || tab.name.trim() === "") {
        errors.push(`Tab ${index + 1} must include a name string.`);
      }

      if (!Array.isArray(tab.nodes)) {
        errors.push(`Tab ${index + 1} must include a nodes array.`);
      }

      if (!Array.isArray(tab.stages)) {
        errors.push(`Tab ${index + 1} must include a stages array.`);
      }

      if (!Array.isArray(tab.edges)) {
        errors.push(`Tab ${index + 1} must include an edges array.`);
      }
    });
  }

  if (!Array.isArray(value.snapshots)) {
    errors.push("Project file must include a snapshots array.");
  }

  if (!isRecord(value.settings)) {
    errors.push("Project file must include a settings object.");
  } else if (
    typeof value.settings.themeId !== "string" ||
    (!VALID_THEME_IDS.has(value.settings.themeId) && !LEGACY_THEME_IDS.has(value.settings.themeId))
  ) {
    errors.push("Project settings must include a supported themeId.");
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, project: value as ProjectFile, errors: [] };
}

export function isProjectFile(value: unknown): value is ProjectFile {
  return validateProjectFile(value).ok;
}
