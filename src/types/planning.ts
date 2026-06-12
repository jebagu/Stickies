export type NodeStatus =
  | "idea"
  | "defined"
  | "associated"
  | "in_progress"
  | "blocked"
  | "ready"
  | "done"
  | "parked";

export type Priority = "P0" | "P1" | "P2";
export type Confidence = "low" | "medium" | "high";
export type LineType = "solid" | "dashed" | "magic";
export type ThemeId = "clean-light" | "clean-dark" | "neon-dark";
export type TabOrientation = "vertical" | "horizontal";

export type ProjectFile = {
  schemaVersion: 1;
  projectName: string;
  activeTabId: string;
  people: Person[];
  workstreams: Workstream[];
  tags: Tag[];
  tabs: PlanningTab[];
  snapshots: Snapshot[];
  settings: ProjectSettings;
  createdAt: string;
  updatedAt: string;
};

export type Person = {
  id: string;
  name: string;
  initials: string;
  kind?: "person" | "organization";
};

export type Workstream = {
  id: string;
  name: string;
  description?: string;
  defaultAssociatedIds?: string[];
  colorToken?: string;
};

export type Tag = {
  id: string;
  label: string;
  colorToken?: string;
};

export type PlanningTab = {
  id: string;
  name: string;
  description?: string;
  orientation?: TabOrientation;
  stages: Stage[];
  nodes: AppNode[];
  edges: AppEdge[];
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  };
  filters?: TabFilters;
};

export type Stage = {
  id: string;
  name: string;
  order: number;
  description?: string;
  colorToken?: string;
  rect?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

export type PlanningNodeData = {
  title: string;
  status: NodeStatus;
  associatedIds: string[];
  workstreamId?: string;
  tagIds?: string[];
  stageId?: string;
  priority?: Priority;
  targetDate?: string;
  confidence?: Confidence;
  notes?: string;
  links?: PlanningLink[];
  createdAt: string;
  updatedAt: string;
};

export type StageBandData = {
  title: string;
  stageId: string;
  orientation?: TabOrientation;
  locked: boolean;
  colorToken?: string;
};

export type AppNodeData = PlanningNodeData | StageBandData;

export type AppNode = {
  id: string;
  type: "planningNode" | "stageBand";
  position: {
    x: number;
    y: number;
  };
  width?: number;
  height?: number;
  data: AppNodeData;
  draggable?: boolean;
  selectable?: boolean;
  deletable?: boolean;
  zIndex?: number;
};

export type AppEdge = {
  id: string;
  source: string;
  target: string;
  type: "planningEdge";
  data: {
    lineType: LineType;
  };
};

export type PlanningLink = {
  id: string;
  label: string;
  url: string;
};

export type Snapshot = {
  id: string;
  label: string;
  note?: string;
  createdAt: string;
  project: Omit<ProjectFile, "snapshots">;
};

export type ProjectSettings = {
  themeId: ThemeId;
  showMiniMap: boolean;
  adminMode: boolean;
  presentationMode: boolean;
};

export type TabFilters = {
  query?: string;
  associatedIds?: string[];
  workstreamIds?: string[];
  statuses?: NodeStatus[];
  priorities?: Priority[];
  blockedOnly?: boolean;
  unassignedOnly?: boolean;
  orphansOnly?: boolean;
  hideRelatedEdges?: boolean;
};

export function isPlanningNodeData(data: AppNodeData): data is PlanningNodeData {
  return "status" in data && "associatedIds" in data;
}

export function isStageBandData(data: AppNodeData): data is StageBandData {
  return "stageId" in data && "locked" in data;
}
