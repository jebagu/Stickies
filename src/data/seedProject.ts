import type {
  AppEdge,
  AppNode,
  NodeStatus,
  Person,
  PlanningNodeData,
  PlanningTab,
  Priority,
  ProjectFile,
  Stage,
  Tag,
  Workstream,
} from "../types/planning";
import { createStageBandNodes, createStageColumnRect, normalizeStagesForLayout } from "../lib/stageLayout";
import { slugId } from "../utils/id";

const SEED_TIMESTAMP = "2026-06-12T00:00:00.000Z";

const DEFAULT_STAGE_NAMES = [
  "Discovery",
  "Strategy / Decisions",
  "Partner Confirmation",
  "Design",
  "Production",
  "Delivery / Install",
  "Live Operations",
  "Post-Experience",
] as const;

const TAB_NAMES = [
  "Overall Project",
  "Workstreams",
  "Audio",
  "Structure",
  "Operations: TopCo",
  "Operations: Co-Ops",
  "Experience Design",
  "Show Music Production",
  "Labs",
  "Legal",
  "Ticketing",
  "Parking Lot",
] as const;

const associationSeed: Array<Pick<Person, "name" | "kind">> = [
  { name: "Jeremy Guillory", kind: "person" },
  { name: "Merijn Royaards", kind: "person" },
  { name: "Ed Cooke", kind: "person" },
  { name: "Ed Goh", kind: "person" },
  { name: "Alexander Morley", kind: "person" },
  { name: "Nicholas Christie", kind: "person" },
  { name: "Sabine", kind: "person" },
  { name: "DNK", kind: "organization" },
  { name: "Sonic Sphere, BV", kind: "organization" },
  { name: "Sonic Spheres, Inc.", kind: "organization" },
  { name: "Rare", kind: "organization" },
  { name: "Richie Britton", kind: "person" },
  { name: "Dom Joseph", kind: "person" },
  { name: "Meelf van Oosten", kind: "person" },
  { name: "Rob Montgomery", kind: "person" },
];

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

export const seedPeople: Person[] = associationSeed.map((entry) => ({
  id: slugId("person", entry.name),
  initials: initialsFromName(entry.name),
  ...entry,
}));

export const seedWorkstreams: Workstream[] = [
  {
    id: "workstream_venue",
    name: "Venue",
    defaultAssociatedIds: ["person_dnk", "person_sonic_sphere_bv", "person_sonic_spheres_inc"],
    colorToken: "venue",
  },
  {
    id: "workstream_delivery_of_physical_sphere",
    name: "Delivery of Physical Sphere",
    defaultAssociatedIds: ["person_nicholas_christie", "person_alexander_morley"],
    colorToken: "sphere",
  },
  {
    id: "workstream_delivery_of_sound_system",
    name: "Delivery of Sound System",
    defaultAssociatedIds: ["person_merijn_royaards", "person_jeremy_guillory"],
    colorToken: "sound",
  },
  {
    id: "workstream_acoustics_consultant",
    name: "Acoustics Consultant",
    defaultAssociatedIds: ["person_sabine"],
    colorToken: "acoustics",
  },
  {
    id: "workstream_operations",
    name: "Operations",
    defaultAssociatedIds: ["person_ed_cooke", "person_ed_goh"],
    colorToken: "operations",
  },
  {
    id: "workstream_ticketing",
    name: "Ticketing",
    colorToken: "ticketing",
  },
  {
    id: "workstream_show_music_production",
    name: "Show Music Production",
    defaultAssociatedIds: ["person_jeremy_guillory"],
    colorToken: "music",
  },
  {
    id: "workstream_labs",
    name: "Labs",
    colorToken: "labs",
  },
  {
    id: "workstream_legal",
    name: "Legal",
    colorToken: "legal",
  },
  {
    id: "workstream_experience_design",
    name: "Experience Design",
    colorToken: "experience",
  },
];

export const seedTags: Tag[] = [
  { id: "tag_critical_path", label: "Critical path", colorToken: "critical" },
  { id: "tag_needs_decision", label: "Needs decision", colorToken: "decision" },
  { id: "tag_external_partner", label: "External partner", colorToken: "partner" },
];

type SeedNodeSpec = {
  title: string;
  status: NodeStatus;
  workstreamId?: string;
  associatedIds?: string[];
  stageName?: (typeof DEFAULT_STAGE_NAMES)[number];
  priority?: Priority;
  confidence?: "low" | "medium" | "high";
  notes?: string;
  tabNames?: readonly (typeof TAB_NAMES)[number][];
  position?: {
    x: number;
    y: number;
  };
};

type SeedEdgeSpec = {
  sourceTitle: string;
  targetTitle: string;
};

const requiredNodeSpecs: SeedNodeSpec[] = [
  {
    title: "Confirm venue decision maker.",
    status: "defined",
    workstreamId: "workstream_venue",
    associatedIds: ["person_dnk", "person_sonic_sphere_bv", "person_sonic_spheres_inc"],
    stageName: "Discovery",
    priority: "P0",
    confidence: "medium",
    tabNames: ["Overall Project", "Workstreams"],
    position: { x: 60, y: 80 },
  },
  {
    title: "Confirm commercial structure.",
    status: "idea",
    workstreamId: "workstream_venue",
    associatedIds: ["person_sonic_spheres_inc"],
    stageName: "Strategy / Decisions",
    priority: "P0",
    tabNames: ["Overall Project", "Workstreams"],
    position: { x: 380, y: 80 },
  },
  {
    title: "Define physical sphere scope.",
    status: "defined",
    workstreamId: "workstream_delivery_of_physical_sphere",
    associatedIds: ["person_nicholas_christie", "person_alexander_morley"],
    stageName: "Discovery",
    priority: "P0",
    tabNames: ["Overall Project", "Structure"],
    position: { x: 60, y: 230 },
  },
  {
    title: "Confirm fabrication requirements.",
    status: "idea",
    workstreamId: "workstream_delivery_of_physical_sphere",
    associatedIds: ["person_nicholas_christie"],
    stageName: "Design",
    priority: "P1",
    tabNames: ["Overall Project", "Structure"],
    position: { x: 1020, y: 230 },
  },
  {
    title: "Define sound system specification.",
    status: "defined",
    workstreamId: "workstream_delivery_of_sound_system",
    associatedIds: ["person_merijn_royaards", "person_jeremy_guillory"],
    stageName: "Strategy / Decisions",
    priority: "P0",
    confidence: "medium",
    tabNames: ["Overall Project", "Audio"],
    position: { x: 380, y: 380 },
  },
  {
    title: "Confirm speaker layout.",
    status: "idea",
    workstreamId: "workstream_delivery_of_sound_system",
    associatedIds: ["person_merijn_royaards"],
    stageName: "Design",
    priority: "P0",
    tabNames: ["Overall Project", "Audio"],
    position: { x: 1020, y: 380 },
  },
  {
    title: "Confirm acoustics consultant scope.",
    status: "defined",
    workstreamId: "workstream_acoustics_consultant",
    associatedIds: ["person_sabine"],
    stageName: "Discovery",
    priority: "P1",
    tabNames: ["Overall Project", "Audio"],
    position: { x: 60, y: 530 },
  },
  {
    title: "Define operating model.",
    status: "idea",
    workstreamId: "workstream_operations",
    associatedIds: ["person_ed_cooke", "person_ed_goh"],
    stageName: "Strategy / Decisions",
    priority: "P0",
    tabNames: ["Overall Project", "Operations: TopCo", "Operations: Co-Ops"],
    position: { x: 380, y: 680 },
  },
  {
    title: "Define partner interface model.",
    status: "idea",
    workstreamId: "workstream_operations",
    associatedIds: ["person_ed_cooke"],
    stageName: "Partner Confirmation",
    priority: "P1",
    tabNames: ["Overall Project", "Operations: Co-Ops"],
    position: { x: 700, y: 680 },
  },
  {
    title: "Choose ticketing platform.",
    status: "idea",
    workstreamId: "workstream_ticketing",
    stageName: "Strategy / Decisions",
    priority: "P1",
    tabNames: ["Overall Project", "Ticketing"],
    position: { x: 380, y: 830 },
  },
  {
    title: "Define ticket tiers.",
    status: "idea",
    workstreamId: "workstream_ticketing",
    stageName: "Design",
    priority: "P2",
    tabNames: ["Overall Project", "Ticketing"],
    position: { x: 1020, y: 830 },
  },
  {
    title: "Identify artists.",
    status: "idea",
    workstreamId: "workstream_show_music_production",
    associatedIds: ["person_jeremy_guillory"],
    stageName: "Discovery",
    priority: "P0",
    tabNames: ["Overall Project", "Show Music Production"],
    position: { x: 60, y: 980 },
  },
  {
    title: "Develop artist workflow.",
    status: "idea",
    workstreamId: "workstream_show_music_production",
    associatedIds: ["person_jeremy_guillory"],
    stageName: "Strategy / Decisions",
    priority: "P0",
    tabNames: ["Overall Project", "Show Music Production"],
    position: { x: 380, y: 980 },
  },
  {
    title: "Define Atmos engineer workflow.",
    status: "defined",
    workstreamId: "workstream_show_music_production",
    associatedIds: ["person_jeremy_guillory"],
    stageName: "Strategy / Decisions",
    priority: "P0",
    tabNames: ["Overall Project", "Show Music Production", "Audio"],
    position: { x: 380, y: 1130 },
  },
  {
    title: "Evaluate Ollie Morgan as possible Atmos engineer.",
    status: "idea",
    workstreamId: "workstream_show_music_production",
    associatedIds: ["person_richie_britton"],
    stageName: "Partner Confirmation",
    priority: "P1",
    tabNames: ["Overall Project", "Show Music Production", "Audio"],
    position: { x: 700, y: 1130 },
  },
  {
    title: "Create technical content development process.",
    status: "idea",
    workstreamId: "workstream_show_music_production",
    associatedIds: ["person_jeremy_guillory"],
    stageName: "Design",
    priority: "P0",
    tabNames: ["Overall Project", "Show Music Production", "Audio"],
    position: { x: 1020, y: 1130 },
  },
  {
    title: "Prepare tier-one artist content-production answer.",
    status: "idea",
    workstreamId: "workstream_show_music_production",
    associatedIds: ["person_jeremy_guillory"],
    stageName: "Production",
    priority: "P0",
    tabNames: ["Overall Project", "Show Music Production"],
    position: { x: 1340, y: 1130 },
  },
  {
    title: "Define lab intake workflow.",
    status: "idea",
    workstreamId: "workstream_labs",
    stageName: "Strategy / Decisions",
    priority: "P2",
    tabNames: ["Overall Project", "Labs"],
    position: { x: 380, y: 1280 },
  },
  {
    title: "Define lab-to-main-show escalation path.",
    status: "idea",
    workstreamId: "workstream_labs",
    stageName: "Production",
    priority: "P2",
    tabNames: ["Overall Project", "Labs"],
    position: { x: 1340, y: 1280 },
  },
  {
    title: "Define artist agreement template.",
    status: "idea",
    workstreamId: "workstream_legal",
    stageName: "Strategy / Decisions",
    priority: "P0",
    tabNames: ["Overall Project", "Legal"],
    position: { x: 380, y: 1430 },
  },
  {
    title: "Confirm IP and music-rights approach.",
    status: "idea",
    workstreamId: "workstream_legal",
    stageName: "Strategy / Decisions",
    priority: "P0",
    tabNames: ["Overall Project", "Legal", "Show Music Production"],
    position: { x: 700, y: 1430 },
  },
  {
    title: "Map pre-arrival experience.",
    status: "idea",
    workstreamId: "workstream_experience_design",
    stageName: "Discovery",
    priority: "P1",
    tabNames: ["Overall Project", "Experience Design"],
    position: { x: 60, y: 1580 },
  },
  {
    title: "Design queue and line experience.",
    status: "idea",
    workstreamId: "workstream_experience_design",
    stageName: "Design",
    priority: "P1",
    tabNames: ["Overall Project", "Experience Design", "Operations: TopCo"],
    position: { x: 1020, y: 1580 },
  },
  {
    title: "Define seating model.",
    status: "idea",
    workstreamId: "workstream_experience_design",
    stageName: "Design",
    priority: "P1",
    tabNames: ["Overall Project", "Experience Design"],
    position: { x: 1020, y: 1730 },
  },
  {
    title: "Define lighting design requirements.",
    status: "idea",
    workstreamId: "workstream_experience_design",
    stageName: "Design",
    priority: "P2",
    tabNames: ["Overall Project", "Experience Design"],
    position: { x: 1340, y: 1730 },
  },
  {
    title: "Define food and beverage concept.",
    status: "parked",
    workstreamId: "workstream_experience_design",
    stageName: "Discovery",
    priority: "P2",
    tabNames: ["Overall Project", "Experience Design", "Parking Lot"],
    position: { x: 60, y: 1880 },
  },
  {
    title: "Define post-experience flow.",
    status: "idea",
    workstreamId: "workstream_experience_design",
    stageName: "Live Operations",
    priority: "P2",
    tabNames: ["Overall Project", "Experience Design"],
    position: { x: 1980, y: 1880 },
  },
];

const requiredEdgeSpecs: SeedEdgeSpec[] = [
  {
    sourceTitle: "Confirm venue decision maker.",
    targetTitle: "Confirm commercial structure.",
  },
  {
    sourceTitle: "Confirm commercial structure.",
    targetTitle: "Define operating model.",
  },
  {
    sourceTitle: "Define physical sphere scope.",
    targetTitle: "Confirm fabrication requirements.",
  },
  {
    sourceTitle: "Define sound system specification.",
    targetTitle: "Confirm speaker layout.",
  },
  {
    sourceTitle: "Confirm acoustics consultant scope.",
    targetTitle: "Define sound system specification.",
  },
  {
    sourceTitle: "Identify artists.",
    targetTitle: "Develop artist workflow.",
  },
  {
    sourceTitle: "Define Atmos engineer workflow.",
    targetTitle: "Create technical content development process.",
  },
  {
    sourceTitle: "Create technical content development process.",
    targetTitle: "Prepare tier-one artist content-production answer.",
  },
  {
    sourceTitle: "Choose ticketing platform.",
    targetTitle: "Define ticket tiers.",
  },
  {
    sourceTitle: "Define operating model.",
    targetTitle: "Design queue and line experience.",
  },
  {
    sourceTitle: "Define seating model.",
    targetTitle: "Define lighting design requirements.",
  },
];

function stageIdFromName(name: string) {
  return slugId("stage", name);
}

function tabIdFromName(name: string) {
  return slugId("tab", name);
}

function createDefaultStages(): Stage[] {
  const stages = DEFAULT_STAGE_NAMES.map((name, order) => {
    return {
      id: stageIdFromName(name),
      name,
      order,
      colorToken: `stage-${order + 1}`,
      rect: createStageColumnRect(order),
    };
  });

  return normalizeStagesForLayout(stages);
}

function createPlanningNode(tabId: string, spec: SeedNodeSpec, index: number): AppNode {
  const stageId = spec.stageName ? stageIdFromName(spec.stageName) : undefined;
  const data: PlanningNodeData = {
    title: spec.title,
    status: spec.status,
    associatedIds: spec.associatedIds ?? [],
    workstreamId: spec.workstreamId,
    stageId,
    priority: spec.priority,
    confidence: spec.confidence ?? "medium",
    notes: spec.notes,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  };

  return {
    id: `${tabId}_node_${slugId("", spec.title).replace(/^_/, "")}`,
    type: "planningNode",
    position: spec.position ?? {
      x: 120 + (index % 4) * 320,
      y: 120 + Math.floor(index / 4) * 160,
    },
    width: 260,
    data,
    draggable: true,
    selectable: true,
    deletable: true,
    zIndex: 10,
  };
}

function createPlanningEdges(tabId: string, nodes: AppNode[], edgeSpecs: SeedEdgeSpec[]): AppEdge[] {
  const nodeIdByTitle = new Map<string, string>();

  nodes.forEach((node) => {
    if (node.type === "planningNode" && "title" in node.data) {
      nodeIdByTitle.set(node.data.title, node.id);
    }
  });

  return edgeSpecs.flatMap((spec) => {
    const source = nodeIdByTitle.get(spec.sourceTitle);
    const target = nodeIdByTitle.get(spec.targetTitle);

    if (!source || !target || source === target) {
      return [];
    }

    return [
      {
        id: `${tabId}_edge_${slugId("", spec.sourceTitle).replace(/^_/, "")}_to_${slugId(
          "",
          spec.targetTitle,
        ).replace(/^_/, "")}`,
        source,
        target,
        type: "planningEdge",
        data: {
          lineType: "solid",
        },
      },
    ];
  });
}

function specsForTab(tabName: (typeof TAB_NAMES)[number]) {
  if (tabName === "Overall Project") {
    return requiredNodeSpecs;
  }

  return requiredNodeSpecs.filter((spec) => spec.tabNames?.includes(tabName));
}

function createPlanningTab(tabName: (typeof TAB_NAMES)[number]): PlanningTab {
  const tabId = tabIdFromName(tabName);
  const stages = createDefaultStages();
  const bandNodes = createStageBandNodes(tabId, stages);
  const planningNodes = specsForTab(tabName).map((spec, index) =>
    createPlanningNode(tabId, spec, index),
  );
  const nodes = [...bandNodes, ...planningNodes];
  const edges = createPlanningEdges(tabId, nodes, requiredEdgeSpecs);

  return {
    id: tabId,
    name: tabName,
    stages,
    nodes,
    edges,
    viewport: {
      x: 0,
      y: 0,
      zoom: 0.8,
    },
    filters: {},
  };
}

export const seedProject: ProjectFile = {
  schemaVersion: 1,
  projectName: "Stickies",
  activeTabId: tabIdFromName("Overall Project"),
  people: seedPeople,
  workstreams: seedWorkstreams,
  tags: seedTags,
  tabs: TAB_NAMES.map(createPlanningTab),
  snapshots: [],
  settings: {
    themeId: "clean-light",
    showMiniMap: true,
    adminMode: false,
    presentationMode: false,
  },
  createdAt: SEED_TIMESTAMP,
  updatedAt: SEED_TIMESTAMP,
};

export function createSeedProject(): ProjectFile {
  return structuredClone(seedProject);
}

export function createBlankProject(): ProjectFile {
  const timestamp = new Date().toISOString();
  const tabId = "tab_planning";
  const stages = createDefaultStages();

  return {
    schemaVersion: 1,
    projectName: "Untitled Project",
    activeTabId: tabId,
    people: [],
    workstreams: [],
    tags: [],
    tabs: [
      {
        id: tabId,
        name: "Planning",
        stages,
        nodes: createStageBandNodes(tabId, stages),
        edges: [],
        viewport: {
          x: 0,
          y: 0,
          zoom: 0.8,
        },
        filters: {},
      },
    ],
    snapshots: [],
    settings: {
      themeId: "clean-light",
      showMiniMap: true,
      adminMode: false,
      presentationMode: false,
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export const seedSummary = {
  people: seedProject.people.length,
  workstreams: seedProject.workstreams.length,
  tabs: seedProject.tabs.length,
  stagesPerTab: DEFAULT_STAGE_NAMES.length,
  planningNodes: seedProject.tabs.reduce(
    (count, tab) => count + tab.nodes.filter((node) => node.type === "planningNode").length,
    0,
  ),
  edges: seedProject.tabs.reduce((count, tab) => count + tab.edges.length, 0),
};
