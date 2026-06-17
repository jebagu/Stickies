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
import { createFunProjectName } from "../lib/stickiesFiles";
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

const TIMELINE_TAB_NAME = "Timeline + Install Process";

const TIMELINE_STAGE_NAMES = [
  "Pre-Production",
  "Site Readiness",
  "Deliveries + Sort",
  "Sphere Assembly",
  "Systems + Interior",
  "Commissioning + Event",
  "Strike + Pack-Out",
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
  TIMELINE_TAB_NAME,
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
  { name: "ArtWithMe", kind: "organization" },
  { name: "Richie Britton", kind: "person" },
  { name: "Dom Joseph", kind: "person" },
  { name: "Meelf van Oosten", kind: "person" },
  { name: "Rob Montgomery", kind: "person" },
  { name: "Chris Linder", kind: "person" },
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
  stageName?: string;
  priority?: Priority;
  confidence?: "low" | "medium" | "high";
  targetDate?: string;
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

const timelineNodeSpecs: SeedNodeSpec[] = [
  {
    title: "Notice to proceed + initial payment.",
    status: "defined",
    workstreamId: "workstream_operations",
    associatedIds: ["person_ed_cooke", "person_artwithme"],
    stageName: "Pre-Production",
    priority: "P0",
    targetDate: "2025-11-12",
    notes: "Timeline source: SS Art Basel 2025 Delivery Plan, page 2. Scheduled Nov 12.",
    position: { x: 60, y: 80 },
  },
  {
    title: "Review storage items.",
    status: "defined",
    workstreamId: "workstream_delivery_of_physical_sphere",
    associatedIds: ["person_nicholas_christie", "person_alexander_morley"],
    stageName: "Pre-Production",
    priority: "P0",
    targetDate: "2025-11-15",
    notes: "Scheduled Nov 13-15.",
    position: { x: 60, y: 230 },
  },
  {
    title: "Purchase, fabricate, repair.",
    status: "defined",
    workstreamId: "workstream_delivery_of_physical_sphere",
    associatedIds: ["person_nicholas_christie", "person_alexander_morley"],
    stageName: "Pre-Production",
    priority: "P0",
    targetDate: "2025-12-02",
    notes: "Scheduled Nov 17-Dec 2. Covers item purchase, fabrication, repair, and replacement prep before site commissioning.",
    position: { x: 60, y: 380 },
  },
  {
    title: "Receive containers, VR, etc.",
    status: "defined",
    workstreamId: "workstream_operations",
    associatedIds: ["person_artwithme", "person_nicholas_christie"],
    stageName: "Site Readiness",
    priority: "P0",
    targetDate: "2025-11-27",
    notes: "Overview row shows Nov 27. Detailed rows split this into 12k VR and shipping-container deliveries.",
    position: { x: 380, y: 80 },
  },
  {
    title: "Power available on site.",
    status: "defined",
    workstreamId: "workstream_operations",
    associatedIds: ["person_artwithme"],
    stageName: "Site Readiness",
    priority: "P0",
    targetDate: "2025-11-27",
    notes: "Rental need: Nov 27-Dec 10. PDF calls for one 50A @ 240V supply and a spider box with two 30A @ 240V outlets.",
    position: { x: 380, y: 230 },
  },
  {
    title: "Telehandler available on site.",
    status: "defined",
    workstreamId: "workstream_operations",
    associatedIds: ["person_artwithme", "person_nicholas_christie"],
    stageName: "Site Readiness",
    priority: "P0",
    targetDate: "2025-11-27",
    notes: "Rental need: Nov 27-Dec 10. 12k capacity, 54ft reach.",
    position: { x: 380, y: 380 },
  },
  {
    title: "Ground anchors ready.",
    status: "defined",
    workstreamId: "workstream_delivery_of_physical_sphere",
    associatedIds: ["person_artwithme", "person_nicholas_christie"],
    stageName: "Site Readiness",
    priority: "P0",
    targetDate: "2025-11-28",
    notes: "Rental need: Nov 28-Dec 10. Includes PE46-Hex penetrators and PE46-TC tie-off cables.",
    position: { x: 380, y: 530 },
  },
  {
    title: "Crane window for install.",
    status: "defined",
    workstreamId: "workstream_delivery_of_physical_sphere",
    associatedIds: ["person_artwithme", "person_nicholas_christie"],
    stageName: "Site Readiness",
    priority: "P0",
    targetDate: "2025-12-01",
    notes: "Install crane window: Dec 1, 8am-12pm. PDF calls for 10k capacity at 32ft minimum reach and 50ft pickpoint height.",
    position: { x: 380, y: 680 },
  },
  {
    title: "Stairs scaffold + ballast ready.",
    status: "defined",
    workstreamId: "workstream_operations",
    associatedIds: ["person_artwithme", "person_alexander_morley"],
    stageName: "Site Readiness",
    priority: "P1",
    targetDate: "2025-12-01",
    notes: "Rental need: Dec 1-Dec 10.",
    position: { x: 380, y: 830 },
  },
  {
    title: "Arrive on site and set up HQ.",
    status: "defined",
    workstreamId: "workstream_operations",
    associatedIds: ["person_ed_cooke", "person_nicholas_christie"],
    stageName: "Deliveries + Sort",
    priority: "P0",
    targetDate: "2025-11-27",
    notes: "Install process scheduled Nov 27.",
    position: { x: 700, y: 80 },
  },
  {
    title: "Receive delivery of 12k VR.",
    status: "defined",
    workstreamId: "workstream_operations",
    associatedIds: ["person_artwithme"],
    stageName: "Deliveries + Sort",
    priority: "P0",
    targetDate: "2025-11-27",
    notes: "Install process scheduled Nov 27.",
    position: { x: 700, y: 230 },
  },
  {
    title: "Receive delivery of shipping containers.",
    status: "defined",
    workstreamId: "workstream_operations",
    associatedIds: ["person_artwithme"],
    stageName: "Deliveries + Sort",
    priority: "P0",
    targetDate: "2025-11-27",
    notes: "Install process scheduled Nov 27.",
    position: { x: 700, y: 380 },
  },
  {
    title: "Unload + stage everything.",
    status: "defined",
    workstreamId: "workstream_operations",
    associatedIds: ["person_nicholas_christie", "person_alexander_morley"],
    stageName: "Deliveries + Sort",
    priority: "P0",
    targetDate: "2025-11-28",
    notes: "Install process scheduled Nov 28.",
    position: { x: 700, y: 530 },
  },
  {
    title: "Sort struts into types.",
    status: "defined",
    workstreamId: "workstream_delivery_of_physical_sphere",
    associatedIds: ["person_nicholas_christie"],
    stageName: "Deliveries + Sort",
    priority: "P0",
    targetDate: "2025-11-28",
    notes: "Install process scheduled Nov 28.",
    position: { x: 700, y: 680 },
  },
  {
    title: "Sort light pods, cloths, cables into types.",
    status: "defined",
    workstreamId: "workstream_delivery_of_physical_sphere",
    associatedIds: ["person_alexander_morley", "person_chris_linder"],
    stageName: "Deliveries + Sort",
    priority: "P1",
    targetDate: "2025-11-28",
    notes: "Install process scheduled Nov 28.",
    position: { x: 700, y: 830 },
  },
  {
    title: "Assemble top half of sphere layer-by-layer.",
    status: "defined",
    workstreamId: "workstream_delivery_of_physical_sphere",
    associatedIds: ["person_nicholas_christie", "person_alexander_morley"],
    stageName: "Sphere Assembly",
    priority: "P0",
    targetDate: "2025-11-29",
    notes: "Scheduled Nov 28-29. Includes structure, lights, and audio layer-by-layer.",
    position: { x: 1020, y: 80 },
  },
  {
    title: "Erect legs.",
    status: "defined",
    workstreamId: "workstream_delivery_of_physical_sphere",
    associatedIds: ["person_nicholas_christie", "person_alexander_morley"],
    stageName: "Sphere Assembly",
    priority: "P0",
    targetDate: "2025-11-30",
    notes: "Install process scheduled Nov 30.",
    position: { x: 1020, y: 230 },
  },
  {
    title: "Assemble bottom half of sphere.",
    status: "defined",
    workstreamId: "workstream_delivery_of_physical_sphere",
    associatedIds: ["person_nicholas_christie", "person_alexander_morley"],
    stageName: "Sphere Assembly",
    priority: "P0",
    targetDate: "2025-11-30",
    notes: "Install process scheduled Nov 30.",
    position: { x: 1020, y: 380 },
  },
  {
    title: "Assemble floor rings and nest in sphere.",
    status: "defined",
    workstreamId: "workstream_delivery_of_physical_sphere",
    associatedIds: ["person_nicholas_christie", "person_alexander_morley"],
    stageName: "Sphere Assembly",
    priority: "P0",
    targetDate: "2025-11-30",
    notes: "Install process scheduled Nov 30.",
    position: { x: 1020, y: 530 },
  },
  {
    title: "Join top to bottom with crane.",
    status: "defined",
    workstreamId: "workstream_delivery_of_physical_sphere",
    associatedIds: ["person_nicholas_christie", "person_artwithme"],
    stageName: "Sphere Assembly",
    priority: "P0",
    targetDate: "2025-12-01",
    notes: "Install process scheduled Dec 1. PDF note: need big crane for this step.",
    position: { x: 1020, y: 680 },
  },
  {
    title: "Wire up lights + audio and test.",
    status: "defined",
    workstreamId: "workstream_delivery_of_sound_system",
    associatedIds: ["person_merijn_royaards", "person_jeremy_guillory", "person_chris_linder"],
    stageName: "Systems + Interior",
    priority: "P0",
    targetDate: "2025-12-01",
    notes: "Install process scheduled Dec 1.",
    position: { x: 1340, y: 80 },
  },
  {
    title: "Build scaffold stairs.",
    status: "defined",
    workstreamId: "workstream_operations",
    associatedIds: ["person_artwithme", "person_alexander_morley"],
    stageName: "Systems + Interior",
    priority: "P1",
    targetDate: "2025-12-02",
    notes: "Install process scheduled Dec 2.",
    position: { x: 1340, y: 230 },
  },
  {
    title: "Install floor truss legs.",
    status: "defined",
    workstreamId: "workstream_delivery_of_physical_sphere",
    associatedIds: ["person_nicholas_christie"],
    stageName: "Systems + Interior",
    priority: "P0",
    targetDate: "2025-12-03",
    notes: "Install process scheduled Dec 3.",
    position: { x: 1340, y: 380 },
  },
  {
    title: "Stretch net and lash.",
    status: "defined",
    workstreamId: "workstream_delivery_of_physical_sphere",
    associatedIds: ["person_nicholas_christie"],
    stageName: "Systems + Interior",
    priority: "P0",
    targetDate: "2025-12-03",
    notes: "Install process scheduled Dec 3.",
    position: { x: 1340, y: 530 },
  },
  {
    title: "Install interior walkways, DJ platform, entry platform.",
    status: "defined",
    workstreamId: "workstream_operations",
    associatedIds: ["person_nicholas_christie", "person_alexander_morley"],
    stageName: "Systems + Interior",
    priority: "P0",
    targetDate: "2025-12-03",
    notes: "Install process scheduled Dec 3.",
    position: { x: 1340, y: 680 },
  },
  {
    title: "Set up signage and bring in cushions.",
    status: "defined",
    workstreamId: "workstream_experience_design",
    associatedIds: ["person_artwithme", "person_ed_cooke"],
    stageName: "Systems + Interior",
    priority: "P1",
    targetDate: "2025-12-04",
    notes: "Install process scheduled Dec 4.",
    position: { x: 1340, y: 830 },
  },
  {
    title: "Test content + live playback capability.",
    status: "defined",
    workstreamId: "workstream_show_music_production",
    associatedIds: ["person_jeremy_guillory", "person_merijn_royaards", "person_richie_britton"],
    stageName: "Commissioning + Event",
    priority: "P0",
    targetDate: "2025-12-04",
    notes: "Scheduled Dec 3-4. This is the content/playback readiness check before the public event window.",
    position: { x: 1660, y: 80 },
  },
  {
    title: "Commissioning.",
    status: "defined",
    workstreamId: "workstream_operations",
    associatedIds: ["person_ed_cooke", "person_nicholas_christie", "person_merijn_royaards"],
    stageName: "Commissioning + Event",
    priority: "P0",
    targetDate: "2025-12-04",
    notes: "Overview schedule shows Dec 3-4.",
    position: { x: 1660, y: 230 },
  },
  {
    title: "Art Basel live operation.",
    status: "defined",
    workstreamId: "workstream_operations",
    associatedIds: ["person_ed_cooke", "person_richie_britton", "person_dom_joseph"],
    stageName: "Commissioning + Event",
    priority: "P0",
    targetDate: "2025-12-07",
    notes: "Event window shown Dec 5-7.",
    position: { x: 1660, y: 380 },
  },
  {
    title: "Remove equator lights, speakers, and crossing cables.",
    status: "defined",
    workstreamId: "workstream_delivery_of_sound_system",
    associatedIds: ["person_merijn_royaards", "person_chris_linder", "person_alexander_morley"],
    stageName: "Strike + Pack-Out",
    priority: "P0",
    targetDate: "2025-12-08",
    notes: "Strike process scheduled Dec 8. Combines removal of lights/speakers around the equator and cables that cross the equator.",
    position: { x: 1980, y: 80 },
  },
  {
    title: "Remove interior walkways and drop net.",
    status: "defined",
    workstreamId: "workstream_delivery_of_physical_sphere",
    associatedIds: ["person_nicholas_christie", "person_alexander_morley"],
    stageName: "Strike + Pack-Out",
    priority: "P0",
    targetDate: "2025-12-08",
    notes: "Strike process scheduled Dec 8.",
    position: { x: 1980, y: 230 },
  },
  {
    title: "Disconnect floor truss legs and rig top pick-point.",
    status: "defined",
    workstreamId: "workstream_delivery_of_physical_sphere",
    associatedIds: ["person_nicholas_christie", "person_artwithme"],
    stageName: "Strike + Pack-Out",
    priority: "P0",
    targetDate: "2025-12-08",
    notes: "Strike process scheduled Dec 8.",
    position: { x: 1980, y: 380 },
  },
  {
    title: "Crane pick for strike.",
    status: "defined",
    workstreamId: "workstream_delivery_of_physical_sphere",
    associatedIds: ["person_artwithme", "person_nicholas_christie"],
    stageName: "Strike + Pack-Out",
    priority: "P0",
    targetDate: "2025-12-09",
    notes: "Strike crane window: Dec 9, 8am-12pm.",
    position: { x: 1980, y: 530 },
  },
  {
    title: "Strip top and bottom of sphere; strike stairs.",
    status: "defined",
    workstreamId: "workstream_delivery_of_physical_sphere",
    associatedIds: ["person_nicholas_christie", "person_alexander_morley"],
    stageName: "Strike + Pack-Out",
    priority: "P0",
    targetDate: "2025-12-09",
    notes: "Strike process scheduled Dec 9.",
    position: { x: 1980, y: 680 },
  },
  {
    title: "Sort + pack everything.",
    status: "defined",
    workstreamId: "workstream_operations",
    associatedIds: ["person_nicholas_christie", "person_alexander_morley"],
    stageName: "Strike + Pack-Out",
    priority: "P0",
    targetDate: "2025-12-10",
    notes: "Strike process scheduled Dec 10.",
    position: { x: 1980, y: 830 },
  },
  {
    title: "Load containers and ship to storage.",
    status: "defined",
    workstreamId: "workstream_operations",
    associatedIds: ["person_artwithme", "person_nicholas_christie"],
    stageName: "Strike + Pack-Out",
    priority: "P0",
    targetDate: "2025-12-10",
    notes: "Overview includes Ship to storage on Dec 10. Detailed process includes loading containers on Dec 10.",
    position: { x: 1980, y: 980 },
  },
];

const timelineEdgeSpecs: SeedEdgeSpec[] = [
  { sourceTitle: "Notice to proceed + initial payment.", targetTitle: "Review storage items." },
  { sourceTitle: "Review storage items.", targetTitle: "Purchase, fabricate, repair." },
  { sourceTitle: "Purchase, fabricate, repair.", targetTitle: "Receive containers, VR, etc." },
  { sourceTitle: "Receive containers, VR, etc.", targetTitle: "Arrive on site and set up HQ." },
  { sourceTitle: "Power available on site.", targetTitle: "Wire up lights + audio and test." },
  { sourceTitle: "Telehandler available on site.", targetTitle: "Unload + stage everything." },
  { sourceTitle: "Ground anchors ready.", targetTitle: "Join top to bottom with crane." },
  { sourceTitle: "Crane window for install.", targetTitle: "Join top to bottom with crane." },
  { sourceTitle: "Stairs scaffold + ballast ready.", targetTitle: "Build scaffold stairs." },
  { sourceTitle: "Arrive on site and set up HQ.", targetTitle: "Receive delivery of 12k VR." },
  { sourceTitle: "Receive delivery of 12k VR.", targetTitle: "Receive delivery of shipping containers." },
  { sourceTitle: "Receive delivery of shipping containers.", targetTitle: "Unload + stage everything." },
  { sourceTitle: "Unload + stage everything.", targetTitle: "Sort struts into types." },
  { sourceTitle: "Unload + stage everything.", targetTitle: "Sort light pods, cloths, cables into types." },
  { sourceTitle: "Sort struts into types.", targetTitle: "Assemble top half of sphere layer-by-layer." },
  { sourceTitle: "Sort light pods, cloths, cables into types.", targetTitle: "Assemble top half of sphere layer-by-layer." },
  { sourceTitle: "Assemble top half of sphere layer-by-layer.", targetTitle: "Erect legs." },
  { sourceTitle: "Erect legs.", targetTitle: "Assemble bottom half of sphere." },
  { sourceTitle: "Assemble bottom half of sphere.", targetTitle: "Assemble floor rings and nest in sphere." },
  { sourceTitle: "Assemble floor rings and nest in sphere.", targetTitle: "Join top to bottom with crane." },
  { sourceTitle: "Join top to bottom with crane.", targetTitle: "Wire up lights + audio and test." },
  { sourceTitle: "Wire up lights + audio and test.", targetTitle: "Build scaffold stairs." },
  { sourceTitle: "Build scaffold stairs.", targetTitle: "Install floor truss legs." },
  { sourceTitle: "Install floor truss legs.", targetTitle: "Stretch net and lash." },
  { sourceTitle: "Stretch net and lash.", targetTitle: "Install interior walkways, DJ platform, entry platform." },
  { sourceTitle: "Install interior walkways, DJ platform, entry platform.", targetTitle: "Set up signage and bring in cushions." },
  { sourceTitle: "Wire up lights + audio and test.", targetTitle: "Test content + live playback capability." },
  { sourceTitle: "Set up signage and bring in cushions.", targetTitle: "Commissioning." },
  { sourceTitle: "Test content + live playback capability.", targetTitle: "Commissioning." },
  { sourceTitle: "Commissioning.", targetTitle: "Art Basel live operation." },
  { sourceTitle: "Art Basel live operation.", targetTitle: "Remove equator lights, speakers, and crossing cables." },
  { sourceTitle: "Remove equator lights, speakers, and crossing cables.", targetTitle: "Remove interior walkways and drop net." },
  { sourceTitle: "Remove interior walkways and drop net.", targetTitle: "Disconnect floor truss legs and rig top pick-point." },
  { sourceTitle: "Disconnect floor truss legs and rig top pick-point.", targetTitle: "Crane pick for strike." },
  { sourceTitle: "Crane pick for strike.", targetTitle: "Strip top and bottom of sphere; strike stairs." },
  { sourceTitle: "Strip top and bottom of sphere; strike stairs.", targetTitle: "Sort + pack everything." },
  { sourceTitle: "Sort + pack everything.", targetTitle: "Load containers and ship to storage." },
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

  return normalizeStagesForLayout(stages, "vertical");
}

function createTimelineStages(): Stage[] {
  const stages = TIMELINE_STAGE_NAMES.map((name, order) => {
    return {
      id: stageIdFromName(name),
      name,
      order,
      colorToken: `stage-${order + 1}`,
      rect: createStageColumnRect(order),
    };
  });

  return normalizeStagesForLayout(stages, "vertical");
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
    targetDate: spec.targetDate,
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
  if (tabName === TIMELINE_TAB_NAME) {
    return timelineNodeSpecs;
  }

  if (tabName === "Overall Project") {
    return requiredNodeSpecs;
  }

  return requiredNodeSpecs.filter((spec) => spec.tabNames?.includes(tabName));
}

function edgesForTab(tabName: (typeof TAB_NAMES)[number]) {
  if (tabName === TIMELINE_TAB_NAME) {
    return timelineEdgeSpecs;
  }

  return requiredEdgeSpecs;
}

function createPlanningTab(tabName: (typeof TAB_NAMES)[number]): PlanningTab {
  const tabId = tabIdFromName(tabName);
  const stages = tabName === TIMELINE_TAB_NAME ? createTimelineStages() : createDefaultStages();
  const bandNodes = createStageBandNodes(tabId, stages, "vertical");
  const planningNodes = specsForTab(tabName).map((spec, index) =>
    createPlanningNode(tabId, spec, index),
  );
  const nodes = [...bandNodes, ...planningNodes];
  const edges = createPlanningEdges(tabId, nodes, edgesForTab(tabName));

  return {
    id: tabId,
    name: tabName,
    description:
      tabName === TIMELINE_TAB_NAME
        ? "PDF-derived Miami Art Basel 2025 timeline and install/strike process."
        : undefined,
    orientation: "vertical",
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
    edgeRoutingMode: "bezier",
    nodeHandleMode: "side",
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
    projectName: createFunProjectName(),
    activeTabId: tabId,
    people: [],
    workstreams: [],
    tags: [],
    tabs: [
      {
        id: tabId,
        name: "Planning",
        orientation: "vertical",
        stages,
        nodes: createStageBandNodes(tabId, stages, "vertical"),
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
      themeId: "neon-dark",
      showMiniMap: true,
      adminMode: false,
      presentationMode: false,
      edgeRoutingMode: "bezier",
      nodeHandleMode: "side",
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
