import {
  applyEdgeChanges,
  applyNodeChanges,
  type EdgeChange,
  type NodeChange,
  type Viewport,
} from "@xyflow/react";
import { create } from "zustand";
import { createBlankProject, createSeedProject } from "../data/seedProject";
import { downloadProjectJson } from "../lib/exportImport";
import { getAppViewMode, isPublicViewMode, type AppViewMode } from "../lib/appMode";
import { loadProjectFromPublicSnapshot } from "../lib/publicProject";
import { createStageBandNodes, normalizeStagesForLayout } from "../lib/stageLayout";
import { clearProjectStorage, loadProjectFromStorage, saveProjectToStorage } from "../lib/storage";
import { isPlanningNodeData } from "../types/planning";
import type {
  AppEdge,
  AppNode,
  LineType,
  Person,
  PlanningNodeData,
  PlanningTab,
  ProjectFile,
  ProjectSettings,
  Snapshot,
  TabFilters,
  ThemeId,
} from "../types/planning";
import { nowIso } from "../utils/dates";
import { createId, slugId } from "../utils/id";

export type SelectedElement =
  | {
      type: "node";
      id: string;
    }
  | {
      type: "edge";
      id: string;
    }
  | {
      type: "tab";
      id: string;
    }
  | null;

export type SaveStatus = "saved" | "saving" | "unsaved" | "error";

type CreateNodeInput = {
  title?: string;
  position?: AppNode["position"];
};

type UpsertAssociatedEntityInput = {
  name: string;
  initials?: string;
  kind?: Person["kind"];
};

type ProjectState = {
  viewMode: AppViewMode;
  project: ProjectFile;
  activeTabId: string;
  selectedElement: SelectedElement;
  filters: TabFilters;
  saveStatus: SaveStatus;
  lastSavedAt?: string;
  storageWarning?: string;
  importError?: string;
  inspectorHidden: boolean;

  loadInitialProject: (viewMode?: AppViewMode) => Promise<void>;
  createNewProject: () => void;
  closeProject: () => void;
  resetToSeedProject: () => void;
  setProjectName: (projectName: string) => void;
  setSelectedElement: (selectedElement: SelectedElement) => void;
  setActiveTab: (tabId: string) => void;
  createTab: (name: string) => void;
  renameTab: (tabId: string, name: string) => void;
  deleteTab: (tabId: string) => void;
  updateTab: (tabId: string, updates: Partial<Omit<PlanningTab, "id">>) => void;
  createNode: (input: CreateNodeInput) => void;
  updateNode: (nodeId: string, data: Partial<PlanningNodeData>) => void;
  addAssociatedEntity: (input: UpsertAssociatedEntityInput) => void;
  updateAssociatedEntity: (personId: string, updates: UpsertAssociatedEntityInput) => void;
  removeAssociatedEntity: (personId: string) => void;
  deleteNode: (nodeId: string) => void;
  duplicateNode: (nodeId: string) => void;
  createEdge: (source: string, target: string) => void;
  updateEdge: (edgeId: string, data: Partial<AppEdge["data"]>) => void;
  deleteEdge: (edgeId: string) => void;
  applyNodesChange: (changes: NodeChange<AppNode>[]) => void;
  applyEdgesChange: (changes: EdgeChange<AppEdge>[]) => void;
  setViewport: (viewport: Viewport) => void;
  setFilters: (filters: TabFilters) => void;
  clearFilters: () => void;
  createSnapshot: (label?: string, note?: string) => void;
  restoreSnapshot: (snapshotId: string) => void;
  exportProject: () => void;
  importProject: (project: ProjectFile) => void;
  setTheme: (themeId: ThemeId) => void;
  toggleAdminMode: () => void;
  togglePresentationMode: () => void;
  toggleMiniMap: () => void;
  setInspectorHidden: (inspectorHidden: boolean) => void;
};

const initialProject = createSeedProject();

type LegacyPlanningNodeData = Partial<PlanningNodeData> & {
  kind?: string;
  status?: string;
  ownerIds?: string[];
  supporterIds?: string[];
  associatedIds?: string[];
};

type LegacyEdgeData = Partial<AppEdge["data"]> & {
  relation?: string;
  highlighted?: boolean;
  label?: string;
  notes?: string;
};

function cloneProjectWithoutSnapshots(project: ProjectFile): Omit<ProjectFile, "snapshots"> {
  const { snapshots: _snapshots, ...projectWithoutSnapshots } = project;
  return structuredClone(projectWithoutSnapshots);
}

function createSnapshotRecord(project: ProjectFile, label?: string, note?: string): Snapshot {
  const timestamp = nowIso();

  return {
    id: createId("snapshot"),
    label: label?.trim() || `Snapshot ${project.snapshots.length + 1}`,
    note,
    createdAt: timestamp,
    project: cloneProjectWithoutSnapshots(project),
  };
}

function normalizeNodeStatus(status: string | undefined): PlanningNodeData["status"] {
  if (!status) {
    return "idea";
  }

  return status === "owner_assigned" ? "associated" : (status as PlanningNodeData["status"]);
}

function normalizeAssociatedIds(data: LegacyPlanningNodeData) {
  return Array.from(
    new Set([...(data.associatedIds ?? []), ...(data.ownerIds ?? []), ...(data.supporterIds ?? [])]),
  );
}

function normalizePlanningNodeData(data: LegacyPlanningNodeData): PlanningNodeData {
  const {
    ownerIds: _ownerIds,
    supporterIds: _supporterIds,
    associatedIds: _associatedIds,
    kind: _kind,
    status,
    ...rest
  } = data;

  return {
    ...(rest as Omit<PlanningNodeData, "associatedIds" | "status">),
    status: normalizeNodeStatus(status),
    associatedIds: normalizeAssociatedIds(data),
  };
}

function normalizeAssociatedEntities(people: ProjectFile["people"]) {
  return people.map((person) => ({
    id: person.id,
    name: person.name,
    initials: normalizeInitials(person.initials, person.name),
    kind: normalizePersonKind(person.kind),
  }));
}

function initialsFromName(name: string) {
  const cleanedName = name.replace(/[,.]/g, " ").trim();

  if (/^[A-Z0-9]+$/.test(cleanedName)) {
    return cleanedName;
  }

  return cleanedName
    .split(/\s+/)
    .filter((part) => part.toLowerCase() !== "van")
    .map((part) => part[0]?.toUpperCase())
    .filter(Boolean)
    .join("")
    .slice(0, 3);
}

function normalizeInitials(initials: string | undefined, name: string) {
  return (initials?.trim() || initialsFromName(name)).toUpperCase().slice(0, 3);
}

function normalizePersonKind(kind: string | undefined): Person["kind"] {
  if (kind === "organization" || kind === "resource") {
    return "organization";
  }

  return "person";
}

function normalizeLineType(data: LegacyEdgeData): LineType {
  if (data.lineType === "solid" || data.lineType === "dashed" || data.lineType === "magic") {
    return data.lineType;
  }

  if (data.relation === "soft_dependency") {
    return "dashed";
  }

  return "solid";
}

function normalizeEdgeData(data: LegacyEdgeData): AppEdge["data"] {
  return {
    lineType: normalizeLineType(data),
  };
}

function createUniquePersonId(people: Person[], name: string) {
  const baseId = slugId("person", name);
  let candidateId = baseId;
  let suffix = 2;

  while (people.some((person) => person.id === candidateId)) {
    candidateId = `${baseId}_${suffix}`;
    suffix += 1;
  }

  return candidateId;
}

function createDefaultStagesFromTab(sourceTab: PlanningTab) {
  return normalizeStagesForLayout(sourceTab.stages.map((stage) => structuredClone(stage)));
}

function normalizeProjectStageColumns(project: ProjectFile): ProjectFile {
  const { snapToGrid: _legacySnapToGrid, ...settingsWithoutLegacySnap } = project.settings as ProjectSettings & {
    snapToGrid?: boolean;
  };
  const normalizedSettings: ProjectSettings = {
    ...settingsWithoutLegacySnap,
    themeId: String(project.settings.themeId) === "react-flow-home" ? "clean-light" : project.settings.themeId,
  };

  return {
    ...project,
    people: normalizeAssociatedEntities(project.people),
    settings: normalizedSettings,
    activeTabId:
      project.tabs.find((tab) => tab.id === project.activeTabId)?.id ?? project.tabs[0]?.id ?? project.activeTabId,
    tabs: project.tabs.map((tab) => {
      const stages = createDefaultStagesFromTab(tab);
      const planningNodes = tab.nodes
        .filter((node) => node.type !== "stageBand")
        .map((node) =>
          node.type === "planningNode"
            ? {
                ...node,
                data: normalizePlanningNodeData(node.data as LegacyPlanningNodeData),
              }
            : node,
        );

      return {
        ...tab,
        name: tab.name === "Orphans / Parking Lot" ? "Parking Lot" : tab.name,
        orientation: "vertical",
        stages,
        nodes: [
          ...createStageBandNodes(tab.id, stages),
          ...planningNodes,
        ],
        edges: tab.edges.map((edge) => ({
          ...edge,
          data: normalizeEdgeData(edge.data as LegacyEdgeData),
        })),
      };
    }),
  };
}

function updateProject(project: ProjectFile, updater: (project: ProjectFile) => ProjectFile) {
  return {
    ...updater(project),
    updatedAt: nowIso(),
  };
}

function getActiveTab(project: ProjectFile, activeTabId: string) {
  return project.tabs.find((tab) => tab.id === activeTabId) ?? project.tabs[0];
}

function updateActiveTab(
  project: ProjectFile,
  activeTabId: string,
  updater: (tab: PlanningTab) => PlanningTab,
) {
  return updateProject(project, (currentProject) => ({
    ...currentProject,
    tabs: currentProject.tabs.map((tab) => (tab.id === activeTabId ? updater(tab) : tab)),
  }));
}

function updateSettings(
  project: ProjectFile,
  updater: (settings: ProjectSettings) => ProjectSettings,
) {
  return updateProject(project, (currentProject) => ({
    ...currentProject,
    settings: updater(currentProject.settings),
  }));
}

let saveTimer: number | undefined;

function canEditProject(get: () => ProjectState) {
  return !isPublicViewMode(get().viewMode);
}

function setReadOnlyWarning(set: (state: Partial<ProjectState>) => void) {
  set({ storageWarning: "Public view is read-only." });
}

function getPublicSafeNodeChanges(changes: NodeChange<AppNode>[]) {
  return changes.filter(
    (change) => change.type === "position" || change.type === "dimensions" || change.type === "select",
  );
}

function scheduleProjectSave(project: ProjectFile, set: (state: Partial<ProjectState>) => void) {
  if (typeof window === "undefined") {
    return;
  }

  set({ saveStatus: "saving" });
  window.clearTimeout(saveTimer);

  saveTimer = window.setTimeout(() => {
    try {
      saveProjectToStorage(project);
      set({
        saveStatus: "saved",
        lastSavedAt: nowIso(),
        storageWarning: undefined,
      });
    } catch (error) {
      set({
        saveStatus: "error",
        storageWarning: error instanceof Error ? error.message : "Project could not be saved.",
      });
    }
  }, 400);
}

function commitProject(
  project: ProjectFile,
  set: (state: Partial<ProjectState>) => void,
  extraState: Partial<ProjectState> = {},
  options: { persist?: boolean } = {},
) {
  if (options.persist !== false) {
    scheduleProjectSave(project, set);
  }

  set({
    project,
    activeTabId: project.activeTabId,
    filters: getActiveTab(project, project.activeTabId).filters ?? {},
    saveStatus: options.persist === false ? "saved" : "unsaved",
    ...extraState,
  });
}

function commitViewProject(
  project: ProjectFile,
  set: (state: Partial<ProjectState>) => void,
  extraState: Partial<ProjectState> = {},
) {
  commitProject(project, set, extraState, { persist: false });
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  viewMode: getAppViewMode(),
  project: initialProject,
  activeTabId: initialProject.activeTabId,
  selectedElement: null,
  filters: {},
  saveStatus: "saved",
  lastSavedAt: undefined,
  storageWarning: undefined,
  importError: undefined,
  inspectorHidden: false,

  loadInitialProject: async (viewMode = getAppViewMode()) => {
    if (isPublicViewMode(viewMode)) {
      const result = await loadProjectFromPublicSnapshot();
      const project = normalizeProjectStageColumns(result.project);

      set({
        viewMode,
        project,
        activeTabId: project.activeTabId,
        filters: getActiveTab(project, project.activeTabId).filters ?? {},
        selectedElement: null,
        saveStatus: "saved",
        storageWarning: result.warning,
        importError: undefined,
        lastSavedAt: undefined,
        inspectorHidden: false,
      });
      return;
    }

    const result = loadProjectFromStorage();
    const project = normalizeProjectStageColumns(result.project);
    set({
      viewMode,
      project,
      activeTabId: project.activeTabId,
      filters: getActiveTab(project, project.activeTabId).filters ?? {},
      selectedElement: null,
      saveStatus: "saved",
      storageWarning: result.warning,
      importError: undefined,
      inspectorHidden: false,
    });
  },

  createNewProject: () => {
    if (!canEditProject(get)) {
      setReadOnlyWarning(set);
      return;
    }

    commitProject(createBlankProject(), set, {
      selectedElement: null,
      storageWarning: undefined,
      importError: undefined,
      inspectorHidden: false,
    });
  },

  closeProject: () => {
    if (!canEditProject(get)) {
      setReadOnlyWarning(set);
      return;
    }

    clearProjectStorage();
    commitProject(createBlankProject(), set, {
      selectedElement: null,
      storageWarning: undefined,
      importError: undefined,
      inspectorHidden: false,
    });
  },

  resetToSeedProject: () => {
    if (!canEditProject(get)) {
      setReadOnlyWarning(set);
      return;
    }

    clearProjectStorage();
    commitProject(createSeedProject(), set, {
      selectedElement: null,
      storageWarning: undefined,
      importError: undefined,
    });
  },

  setProjectName: (projectName) => {
    if (!canEditProject(get)) {
      setReadOnlyWarning(set);
      return;
    }

    const { project } = get();
    const trimmedName = projectName.trim();

    if (trimmedName === "" || trimmedName === project.projectName) {
      return;
    }

    const nextProject = updateProject(project, (currentProject) => ({
      ...currentProject,
      projectName: trimmedName,
    }));

    commitProject(nextProject, set);
  },

  setSelectedElement: (selectedElement) => {
    set({ selectedElement });
  },

  setActiveTab: (tabId) => {
    const { project, viewMode } = get();
    const nextProject = updateProject(project, (currentProject) => ({
      ...currentProject,
      activeTabId: tabId,
    }));

    const extraState = {
      selectedElement: { type: "tab", id: tabId },
    } satisfies Partial<ProjectState>;

    if (isPublicViewMode(viewMode)) {
      commitViewProject(nextProject, set, extraState);
      return;
    }

    commitProject(nextProject, set, extraState);
  },

  createTab: (name) => {
    if (!canEditProject(get)) {
      setReadOnlyWarning(set);
      return;
    }

    const { project } = get();
    const templateTab = project.tabs[0];
    const tabId = slugId("tab", name);
    const stages = createDefaultStagesFromTab(templateTab);
    const newTab: PlanningTab = {
      id: tabId,
      name,
      orientation: "vertical",
      stages,
      nodes: createStageBandNodes(tabId, stages),
      edges: [],
      viewport: { x: 0, y: 0, zoom: 0.8 },
      filters: {},
    };
    const nextProject = updateProject(project, (currentProject) => ({
      ...currentProject,
      activeTabId: newTab.id,
      tabs: [...currentProject.tabs, newTab],
    }));

    commitProject(nextProject, set, {
      selectedElement: { type: "tab", id: newTab.id },
    });
  },

  renameTab: (tabId, name) => {
    if (!canEditProject(get)) {
      setReadOnlyWarning(set);
      return;
    }

    const { project } = get();
    const nextProject = updateProject(project, (currentProject) => ({
      ...currentProject,
      tabs: currentProject.tabs.map((tab) => (tab.id === tabId ? { ...tab, name } : tab)),
    }));

    commitProject(nextProject, set);
  },

  deleteTab: (tabId) => {
    if (!canEditProject(get)) {
      setReadOnlyWarning(set);
      return;
    }

    const { project } = get();

    if (project.tabs.length <= 1) {
      set({ storageWarning: "The last tab cannot be deleted." });
      return;
    }

    const remainingTabs = project.tabs.filter((tab) => tab.id !== tabId);
    const nextActiveTabId =
      project.activeTabId === tabId ? remainingTabs[0]?.id ?? project.activeTabId : project.activeTabId;
    const nextProject = updateProject(project, (currentProject) => ({
      ...currentProject,
      activeTabId: nextActiveTabId,
      tabs: remainingTabs,
    }));

    commitProject(nextProject, set, {
      selectedElement: { type: "tab", id: nextActiveTabId },
    });
  },

  updateTab: (tabId, updates) => {
    if (!canEditProject(get)) {
      setReadOnlyWarning(set);
      return;
    }

    const { project } = get();
    const nextProject = updateProject(project, (currentProject) => ({
      ...currentProject,
      tabs: currentProject.tabs.map((tab) => (tab.id === tabId ? { ...tab, ...updates } : tab)),
    }));

    commitProject(nextProject, set);
  },

  createNode: ({ title, position }) => {
    if (!canEditProject(get)) {
      setReadOnlyWarning(set);
      return;
    }

    const { project, activeTabId } = get();
    const activeTab = getActiveTab(project, activeTabId);
    const planningNodeCount = activeTab.nodes.filter((node) => node.type === "planningNode").length;
    const timestamp = nowIso();
    const newNode: AppNode = {
      id: createId("node"),
      type: "planningNode",
      position: position ?? {
        x: 120 + (planningNodeCount % 4) * 320,
        y: 120 + Math.floor(planningNodeCount / 4) * 160,
      },
      width: 260,
      data: {
        title: title ?? "New item",
        status: "idea",
        associatedIds: [],
        confidence: "medium",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      draggable: true,
      selectable: true,
      deletable: true,
      zIndex: 10,
    };
    const nextProject = updateActiveTab(project, activeTabId, (tab) => ({
      ...tab,
      nodes: [...tab.nodes, newNode],
    }));

    commitProject(nextProject, set, {
      selectedElement: { type: "node", id: newNode.id },
    });
  },

  updateNode: (nodeId, data) => {
    if (!canEditProject(get)) {
      setReadOnlyWarning(set);
      return;
    }

    const { project, activeTabId } = get();
    const nextProject = updateActiveTab(project, activeTabId, (tab) => ({
      ...tab,
      nodes: tab.nodes.map((node) => {
        if (node.id !== nodeId || node.type !== "planningNode" || !isPlanningNodeData(node.data)) {
          return node;
        }

        return {
          ...node,
          data: {
            ...node.data,
            ...data,
            updatedAt: nowIso(),
          },
        };
      }),
    }));

    commitProject(nextProject, set);
  },

  addAssociatedEntity: (input) => {
    if (!canEditProject(get)) {
      setReadOnlyWarning(set);
      return;
    }

    const { project } = get();
    const name = input.name.trim();

    if (!name) {
      set({ storageWarning: "Name is required." });
      return;
    }

    const newPerson: Person = {
      id: createUniquePersonId(project.people, name),
      name,
      initials: normalizeInitials(input.initials, name),
      kind: normalizePersonKind(input.kind),
    };
    const nextProject = updateProject(project, (currentProject) => ({
      ...currentProject,
      people: [...currentProject.people, newPerson],
    }));

    commitProject(nextProject, set);
  },

  updateAssociatedEntity: (personId, updates) => {
    if (!canEditProject(get)) {
      setReadOnlyWarning(set);
      return;
    }

    const { project } = get();
    const name = updates.name.trim();

    if (!name) {
      set({ storageWarning: "Name is required." });
      return;
    }

    const nextProject = updateProject(project, (currentProject) => ({
      ...currentProject,
      people: currentProject.people.map((person) =>
        person.id === personId
          ? {
              ...person,
              name,
              initials: normalizeInitials(updates.initials, name),
              kind: normalizePersonKind(updates.kind ?? person.kind),
            }
          : person,
      ),
    }));

    commitProject(nextProject, set);
  },

  removeAssociatedEntity: (personId) => {
    if (!canEditProject(get)) {
      setReadOnlyWarning(set);
      return;
    }

    const { project } = get();
    const person = project.people.find((candidate) => candidate.id === personId);

    if (!person) {
      set({ storageWarning: "Associated item could not be found." });
      return;
    }

    const snapshot = createSnapshotRecord(
      project,
      `Before removing ${person.name}`,
      `Automatic snapshot before removing ${person.name} from associated lists.`,
    );
    const nextProject = updateProject(project, (currentProject) => ({
      ...currentProject,
      people: currentProject.people.filter((candidate) => candidate.id !== personId),
      workstreams: currentProject.workstreams.map((workstream) => ({
        ...workstream,
        defaultAssociatedIds: workstream.defaultAssociatedIds?.filter((associatedId) => associatedId !== personId),
      })),
      tabs: currentProject.tabs.map((tab) => ({
        ...tab,
        nodes: tab.nodes.map((node) =>
          node.type === "planningNode" && isPlanningNodeData(node.data)
            ? {
                ...node,
                data: {
                  ...node.data,
                  associatedIds: (node.data.associatedIds ?? []).filter((associatedId) => associatedId !== personId),
                  updatedAt: nowIso(),
                },
              }
            : node,
        ),
      })),
      snapshots: [snapshot, ...currentProject.snapshots],
    }));

    commitProject(nextProject, set, {
      selectedElement: null,
    });
  },

  deleteNode: (nodeId) => {
    if (!canEditProject(get)) {
      setReadOnlyWarning(set);
      return;
    }

    const { project, activeTabId } = get();
    const nextProject = updateActiveTab(project, activeTabId, (tab) => ({
      ...tab,
      nodes: tab.nodes.filter((node) => node.id !== nodeId),
      edges: tab.edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
    }));

    commitProject(nextProject, set, {
      selectedElement: null,
    });
  },

  duplicateNode: (nodeId) => {
    if (!canEditProject(get)) {
      setReadOnlyWarning(set);
      return;
    }

    const { project, activeTabId } = get();
    const activeTab = getActiveTab(project, activeTabId);
    const sourceNode = activeTab.nodes.find((node) => node.id === nodeId);

    if (!sourceNode || sourceNode.type !== "planningNode") {
      return;
    }

    const duplicatedNode: AppNode = {
      ...structuredClone(sourceNode),
      id: createId("node"),
      position: {
        x: sourceNode.position.x + 32,
        y: sourceNode.position.y + 32,
      },
      data:
        isPlanningNodeData(sourceNode.data)
          ? {
              ...sourceNode.data,
              title: `${sourceNode.data.title} copy`,
              createdAt: nowIso(),
              updatedAt: nowIso(),
            }
          : sourceNode.data,
    };
    const nextProject = updateActiveTab(project, activeTabId, (tab) => ({
      ...tab,
      nodes: [...tab.nodes, duplicatedNode],
    }));

    commitProject(nextProject, set, {
      selectedElement: { type: "node", id: duplicatedNode.id },
    });
  },

  createEdge: (source, target) => {
    if (!canEditProject(get)) {
      setReadOnlyWarning(set);
      return;
    }

    const { project, activeTabId } = get();
    const activeTab = getActiveTab(project, activeTabId);

    if (source === target) {
      set({ storageWarning: "Self-dependencies are not allowed." });
      return;
    }

    const existingEdge = activeTab.edges.find((edge) => edge.source === source && edge.target === target);

    if (existingEdge) {
      set({ selectedElement: { type: "edge", id: existingEdge.id } });
      return;
    }

    const newEdge: AppEdge = {
      id: createId("edge"),
      source,
      target,
      type: "planningEdge",
      data: {
        lineType: "solid",
      },
    };
    const nextProject = updateActiveTab(project, activeTabId, (tab) => ({
      ...tab,
      edges: [...tab.edges, newEdge],
    }));

    commitProject(nextProject, set, {
      selectedElement: { type: "edge", id: newEdge.id },
    });
  },

  updateEdge: (edgeId, data) => {
    if (!canEditProject(get)) {
      setReadOnlyWarning(set);
      return;
    }

    const { project, activeTabId } = get();
    const nextProject = updateActiveTab(project, activeTabId, (tab) => ({
      ...tab,
      edges: tab.edges.map((edge) =>
        edge.id === edgeId
          ? {
              ...edge,
              data: {
                ...edge.data,
                ...data,
              },
            }
          : edge,
      ),
    }));

    commitProject(nextProject, set);
  },

  deleteEdge: (edgeId) => {
    if (!canEditProject(get)) {
      setReadOnlyWarning(set);
      return;
    }

    const { project, activeTabId } = get();
    const nextProject = updateActiveTab(project, activeTabId, (tab) => ({
      ...tab,
      edges: tab.edges.filter((edge) => edge.id !== edgeId),
    }));

    commitProject(nextProject, set, {
      selectedElement: null,
    });
  },

  applyNodesChange: (changes) => {
    const { project, activeTabId, viewMode } = get();

    if (isPublicViewMode(viewMode)) {
      const publicSafeChanges = getPublicSafeNodeChanges(changes);

      if (publicSafeChanges.length === 0) {
        return;
      }

      const nextProject = updateActiveTab(project, activeTabId, (tab) => ({
        ...tab,
        nodes: applyNodeChanges(publicSafeChanges, tab.nodes),
      }));

      commitViewProject(nextProject, set);
      return;
    }

    const nextProject = updateActiveTab(project, activeTabId, (tab) => ({
      ...tab,
      nodes: applyNodeChanges(changes, tab.nodes),
    }));

    commitProject(nextProject, set);
  },

  applyEdgesChange: (changes) => {
    if (!canEditProject(get)) {
      return;
    }

    const { project, activeTabId } = get();
    const nextProject = updateActiveTab(project, activeTabId, (tab) => ({
      ...tab,
      edges: applyEdgeChanges(changes, tab.edges),
    }));

    commitProject(nextProject, set);
  },

  setViewport: (viewport) => {
    if (!canEditProject(get)) {
      return;
    }

    const { project, activeTabId } = get();
    const nextProject = updateActiveTab(project, activeTabId, (tab) => ({
      ...tab,
      viewport,
    }));

    commitProject(nextProject, set);
  },

  setFilters: (filters) => {
    if (!canEditProject(get)) {
      setReadOnlyWarning(set);
      return;
    }

    const { project, activeTabId } = get();
    const nextProject = updateActiveTab(project, activeTabId, (tab) => ({
      ...tab,
      filters,
    }));

    commitProject(nextProject, set, { filters });
  },

  clearFilters: () => {
    get().setFilters({});
  },

  createSnapshot: (label, note) => {
    if (!canEditProject(get)) {
      setReadOnlyWarning(set);
      return;
    }

    const { project } = get();
    const snapshot = createSnapshotRecord(project, label, note);
    const nextProject = updateProject(project, (currentProject) => ({
      ...currentProject,
      snapshots: [snapshot, ...currentProject.snapshots],
    }));

    commitProject(nextProject, set);
  },

  restoreSnapshot: (snapshotId) => {
    if (!canEditProject(get)) {
      setReadOnlyWarning(set);
      return;
    }

    const { project } = get();
    const snapshot = project.snapshots.find((candidate) => candidate.id === snapshotId);

    if (!snapshot) {
      set({ storageWarning: "Snapshot could not be found." });
      return;
    }

    const restoredProject: ProjectFile = normalizeProjectStageColumns({
      ...structuredClone(snapshot.project),
      snapshots: project.snapshots,
      updatedAt: nowIso(),
    });

    commitProject(restoredProject, set, {
      selectedElement: null,
    });
  },

  exportProject: () => {
    if (!canEditProject(get)) {
      setReadOnlyWarning(set);
      return;
    }

    downloadProjectJson(get().project);
  },

  importProject: (project) => {
    if (!canEditProject(get)) {
      setReadOnlyWarning(set);
      return;
    }

    commitProject(
      normalizeProjectStageColumns({
        ...structuredClone(project),
        updatedAt: nowIso(),
      }),
      set,
      {
        selectedElement: null,
        importError: undefined,
      },
    );
  },

  setTheme: (themeId) => {
    const { project, viewMode } = get();
    const nextProject = updateSettings(project, (settings) => ({
      ...settings,
      themeId,
    }));

    if (isPublicViewMode(viewMode)) {
      commitViewProject(nextProject, set);
      return;
    }

    commitProject(nextProject, set);
  },

  toggleAdminMode: () => {
    if (!canEditProject(get)) {
      setReadOnlyWarning(set);
      return;
    }

    const { project } = get();
    const nextProject = updateSettings(project, (settings) => ({
      ...settings,
      adminMode: !settings.adminMode,
    }));

    commitProject(nextProject, set);
  },

  togglePresentationMode: () => {
    if (!canEditProject(get)) {
      setReadOnlyWarning(set);
      return;
    }

    const { project } = get();
    const nextProject = updateSettings(project, (settings) => ({
      ...settings,
      presentationMode: !settings.presentationMode,
    }));

    commitProject(nextProject, set);
  },

  toggleMiniMap: () => {
    const { project, viewMode } = get();
    const nextProject = updateSettings(project, (settings) => ({
      ...settings,
      showMiniMap: !settings.showMiniMap,
    }));

    if (isPublicViewMode(viewMode)) {
      commitViewProject(nextProject, set);
      return;
    }

    commitProject(nextProject, set);
  },

  setInspectorHidden: (inspectorHidden) => {
    set({ inspectorHidden });
  },
}));
