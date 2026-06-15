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
export type ProjectSchemaVersion = 1 | 2;
export type StageRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ProjectFile = {
  schemaVersion: ProjectSchemaVersion;
  projectName: string;
  projectOrigin?: ProjectOrigin;
  graphSnapshots?: GraphSnapshot[];
  activeTabId: string;
  people: Person[];
  workstreams: Workstream[];
  tags: Tag[];
  tabs: PlanningTab[];
  snapshots: Snapshot[];
  settings: ProjectSettings;
  softwareGraphNavigation?: SoftwareGraphNavigation;
  createdAt: string;
  updatedAt: string;
};

export type ProjectOrigin = {
  source?: string;
  sourcePath?: string;
  generatedAt?: string;
  analyzer?: string;
  [key: string]: unknown;
};

export type GraphSnapshot = {
  id: string;
  label?: string;
  buildId?: string;
  buildIdentity?: string;
  observedAt?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
};

export type SoftwareGraphNavigation = {
  [key: string]: unknown;
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
  kind?: string;
  generated?: boolean;
  readOnly?: boolean;
  layout?: Record<string, unknown>;
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
  rect?: StageRect;
  orientationRects?: Partial<Record<TabOrientation, StageRect>>;
};

export type PlanningNodeData = {
  title: string;
  status: NodeStatus;
  associatedIds: string[];
  softwareGraph?: SoftwareGraphNodeMetadata;
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
    label?: string;
    softwareGraph?: SoftwareGraphEdgeMetadata;
    [key: string]: unknown;
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
  generatedSoftwareGraph?: boolean;
  readOnlyGeneratedTabs?: boolean;
  [key: string]: unknown;
};

export type SoftwareGraphProvenance = {
  sourceType?: string;
  extractor?: string;
  observedAt?: string;
  [key: string]: unknown;
};

export type SoftwareGraphNodeMetadata = {
  id: string;
  nodeKind?: string;
  path?: string;
  symbol?: string;
  provenance?: SoftwareGraphProvenance;
  sourcePath?: string;
  lineStart?: number;
  lineEnd?: number;
  confidence?: number | string;
  riskLabels?: string[];
  testCoverage?: string | number | boolean | Record<string, unknown>;
  snapshotId?: string;
  buildId?: string;
  buildIdentity?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
};

export type SoftwareGraphEdgeMetadata = {
  id: string;
  edgeKind?: string;
  provenance?: SoftwareGraphProvenance;
  sourcePath?: string;
  lineStart?: number;
  lineEnd?: number;
  confidence?: number | string;
  snapshotId?: string;
  buildId?: string;
  buildIdentity?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
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
