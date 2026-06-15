import type { ProjectFile } from "../types/planning";

const VALID_THEME_IDS = new Set(["clean-light", "clean-dark", "neon-dark"]);
const LEGACY_THEME_IDS = new Set(["react-flow-home"]);
const VALID_EDGE_ROUTING_MODES = new Set(["bezier", "smooth-step", "straight"]);
const VALID_NODE_HANDLE_MODES = new Set(["side", "all-sides"]);
const VALID_ASSOCIATED_ENTITY_KINDS = new Set(["person", "organization", "resource"]);
const VALID_TAB_ORIENTATIONS = new Set(["vertical", "horizontal"]);
const DEFAULT_THEME_ID = "clean-light";

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

function isValidRect(value: unknown) {
  return (
    isRecord(value) &&
    typeof value.x === "number" &&
    typeof value.y === "number" &&
    typeof value.width === "number" &&
    typeof value.height === "number"
  );
}

function hasSoftwareGraphProvenance(value: unknown) {
  if (!isRecord(value)) {
    return false;
  }

  const data = isRecord(value.data) ? value.data : undefined;
  const softwareGraph = data && isRecord(data.softwareGraph) ? data.softwareGraph : undefined;

  return Boolean(softwareGraph && softwareGraph.provenance !== undefined);
}

function isGeneratedTab(tab: Record<string, unknown>) {
  const kind = typeof tab.kind === "string" ? tab.kind.toLowerCase() : "";

  return (
    tab.generated === true ||
    tab.readOnly === true ||
    kind.includes("generated") ||
    kind.includes("software") ||
    kind.includes("graph")
  );
}

function normalizeProjectForValidation(value: Record<string, unknown>): Record<string, unknown> {
  const settings = isRecord(value.settings) ? value.settings : {};
  const normalizedSettings = isRecord(value.settings)
    ? {
        ...settings,
        edgeRoutingMode:
          settings.edgeRoutingMode === undefined
            ? "bezier"
            : settings.edgeRoutingMode,
        nodeHandleMode:
          settings.nodeHandleMode === undefined
            ? "side"
            : settings.nodeHandleMode,
      }
    : value.settings;

  if (value.schemaVersion !== 2) {
    return {
      ...value,
      settings: normalizedSettings,
    };
  }

  return {
    ...value,
    tabs: Array.isArray(value.tabs)
      ? value.tabs.map((tab) => (isRecord(tab) ? { ...tab, stages: Array.isArray(tab.stages) ? tab.stages : [] } : tab))
      : value.tabs,
    settings: {
      ...(isRecord(normalizedSettings) ? normalizedSettings : {}),
      themeId:
        typeof settings.themeId === "string" && VALID_THEME_IDS.has(settings.themeId)
          ? settings.themeId
          : DEFAULT_THEME_ID,
      showMiniMap: typeof settings.showMiniMap === "boolean" ? settings.showMiniMap : true,
      adminMode: typeof settings.adminMode === "boolean" ? settings.adminMode : false,
      presentationMode: typeof settings.presentationMode === "boolean" ? settings.presentationMode : false,
      readOnlyGeneratedTabs:
        typeof settings.readOnlyGeneratedTabs === "boolean"
          ? settings.readOnlyGeneratedTabs
          : settings.generatedSoftwareGraph === true
            ? true
            : undefined,
    },
    snapshots: Array.isArray(value.snapshots) ? value.snapshots : [],
    createdAt: typeof value.createdAt === "string" ? value.createdAt : new Date().toISOString(),
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : new Date().toISOString(),
  };
}

export function validateProjectFile(value: unknown): ValidationResult {
  const errors: string[] = [];

  if (!isRecord(value)) {
    return { ok: false, errors: ["Project file must be a JSON object."] };
  }

  const project = normalizeProjectForValidation(value);
  const schemaVersion = project.schemaVersion;

  if (schemaVersion !== 1 && schemaVersion !== 2) {
    errors.push("Project file must use schemaVersion 1 or 2.");
  }

  if (schemaVersion === 2) {
    if (!isRecord(project.projectOrigin)) {
      errors.push("Schema v2 project files must include a projectOrigin object.");
    }

    if (!Array.isArray(project.graphSnapshots) || project.graphSnapshots.length === 0) {
      errors.push("Schema v2 project files must include at least one graphSnapshots entry.");
    }
  }

  if (typeof project.projectName !== "string" || project.projectName.trim() === "") {
    errors.push("Project file must include a projectName string.");
  }

  if (!Array.isArray(project.people)) {
    errors.push("Project file must include a people array.");
  } else {
    project.people.forEach((person, index) => {
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

  if (!Array.isArray(project.workstreams)) {
    errors.push("Project file must include a workstreams array.");
  }

  if (!Array.isArray(project.tags)) {
    errors.push("Project file must include a tags array.");
  }

  if (!Array.isArray(project.tabs) || project.tabs.length === 0) {
    errors.push("Project file must include at least one tab.");
  } else {
    project.tabs.forEach((tab, index) => {
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

      if (tab.orientation !== undefined && !VALID_TAB_ORIENTATIONS.has(String(tab.orientation))) {
        errors.push(`Tab ${index + 1} orientation must be vertical or horizontal.`);
      }

      if (!Array.isArray(tab.nodes)) {
        errors.push(`Tab ${index + 1} must include a nodes array.`);
      }

      if (schemaVersion === 1 && !Array.isArray(tab.stages)) {
        errors.push(`Tab ${index + 1} must include a stages array.`);
      } else if (Array.isArray(tab.stages)) {
        tab.stages.forEach((stage, stageIndex) => {
          if (!isRecord(stage)) {
            errors.push(`Tab ${index + 1} stage ${stageIndex + 1} must be an object.`);
            return;
          }

          if (stage.rect !== undefined && !isValidRect(stage.rect)) {
            errors.push(`Tab ${index + 1} stage ${stageIndex + 1} rect must include x, y, width, and height.`);
          }

          if (stage.orientationRects !== undefined) {
            const orientationRects = stage.orientationRects;

            if (!isRecord(orientationRects)) {
              errors.push(`Tab ${index + 1} stage ${stageIndex + 1} orientationRects must be an object.`);
              return;
            }

            ["vertical", "horizontal"].forEach((orientation) => {
              const rect = orientationRects[orientation];

              if (rect !== undefined && !isValidRect(rect)) {
                errors.push(
                  `Tab ${index + 1} stage ${stageIndex + 1} ${orientation} rect must include x, y, width, and height.`,
                );
              }
            });
          }
        });
      }

      if (!Array.isArray(tab.edges)) {
        errors.push(`Tab ${index + 1} must include an edges array.`);
      } else if (Array.isArray(tab.nodes)) {
        const nodeIds = new Set(
          tab.nodes.flatMap((node) => (isRecord(node) && typeof node.id === "string" ? [node.id] : [])),
        );

        tab.edges.forEach((edge, edgeIndex) => {
          if (!isRecord(edge)) {
            errors.push(`Tab ${index + 1} edge ${edgeIndex + 1} must be an object.`);
            return;
          }

          if (typeof edge.source !== "string" || !nodeIds.has(edge.source)) {
            errors.push(`Tab ${index + 1} edge ${edgeIndex + 1} source must reference a node in the tab.`);
          }

          if (typeof edge.target !== "string" || !nodeIds.has(edge.target)) {
            errors.push(`Tab ${index + 1} edge ${edgeIndex + 1} target must reference a node in the tab.`);
          }
        });
      }

      if (schemaVersion === 2 && isGeneratedTab(tab)) {
        if (Array.isArray(tab.nodes)) {
          tab.nodes.forEach((node, nodeIndex) => {
            if (!hasSoftwareGraphProvenance(node)) {
              errors.push(`Tab ${index + 1} generated node ${nodeIndex + 1} must include softwareGraph provenance.`);
            }
          });
        }

        if (Array.isArray(tab.edges)) {
          tab.edges.forEach((edge, edgeIndex) => {
            if (!hasSoftwareGraphProvenance(edge)) {
              errors.push(`Tab ${index + 1} generated edge ${edgeIndex + 1} must include softwareGraph provenance.`);
            }
          });
        }
      }
    });
  }

  if (!Array.isArray(project.snapshots)) {
    errors.push("Project file must include a snapshots array.");
  }

  if (!isRecord(project.settings)) {
    errors.push("Project file must include a settings object.");
  } else if (
    typeof project.settings.themeId !== "string" ||
    (!VALID_THEME_IDS.has(project.settings.themeId) && !LEGACY_THEME_IDS.has(project.settings.themeId))
  ) {
    errors.push("Project settings must include a supported themeId.");
  } else {
    if (
      project.settings.edgeRoutingMode !== undefined &&
      !VALID_EDGE_ROUTING_MODES.has(String(project.settings.edgeRoutingMode))
    ) {
      errors.push("Project settings edgeRoutingMode must be bezier, smooth-step, or straight.");
    }

    if (
      project.settings.nodeHandleMode !== undefined &&
      !VALID_NODE_HANDLE_MODES.has(String(project.settings.nodeHandleMode))
    ) {
      errors.push("Project settings nodeHandleMode must be side or all-sides.");
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, project: project as ProjectFile, errors: [] };
}

export function isProjectFile(value: unknown): value is ProjectFile {
  return validateProjectFile(value).ok;
}
