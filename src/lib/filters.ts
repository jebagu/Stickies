import type { AppEdge, AppNode, Person, TabFilters, Tag, Workstream } from "../types/planning";
import { isPlanningNodeData } from "../types/planning";

type FilterContext = {
  people: Person[];
  workstreams: Workstream[];
  tags: Tag[];
};

type FilteredFlowElements = {
  nodes: AppNode[];
  edges: AppEdge[];
  visiblePlanningNodeCount: number;
};

type LegacyTabFilters = TabFilters & {
  ownerIds?: string[];
};

function normalizeSearchText(value: string | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function matchesText(node: AppNode, query: string, context: FilterContext) {
  if (!query || !isPlanningNodeData(node.data)) {
    return true;
  }

  const data = node.data;
  const associatedIds = data.associatedIds ?? [];
  const associatedText = associatedIds
    .map((associatedId) => context.people.find((person) => person.id === associatedId))
    .filter(Boolean)
    .map((person) => `${person?.name ?? ""} ${person?.initials ?? ""}`)
    .join(" ");
  const workstream = context.workstreams.find((candidate) => candidate.id === data.workstreamId);
  const tagText = (data.tagIds ?? [])
    .map((tagId) => context.tags.find((tag) => tag.id === tagId)?.label ?? "")
    .join(" ");
  const linkText = (data.links ?? []).map((link) => `${link.label} ${link.url}`).join(" ");
  const haystack = [
    data.title,
    data.notes,
    associatedText,
    workstream?.name,
    tagText,
    linkText,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

function matchesFilters(node: AppNode, filters: TabFilters, context: FilterContext) {
  if (node.type === "stageBand") {
    return true;
  }

  if (!isPlanningNodeData(node.data)) {
    return false;
  }

  const data = node.data;
  const associatedIds = data.associatedIds ?? [];
  const query = normalizeSearchText(filters.query);

  if (!matchesText(node, query, context)) {
    return false;
  }

  const legacyFilters = filters as LegacyTabFilters;
  const associatedFilterIds = filters.associatedIds ?? legacyFilters.ownerIds;

  if (
    associatedFilterIds?.length &&
    !associatedFilterIds.some((associatedId) => associatedIds.includes(associatedId))
  ) {
    return false;
  }

  if (filters.workstreamIds?.length && !filters.workstreamIds.includes(data.workstreamId ?? "")) {
    return false;
  }

  if (filters.statuses?.length && !filters.statuses.includes(data.status)) {
    return false;
  }

  if (filters.priorities?.length && !filters.priorities.includes(data.priority ?? "P2")) {
    return false;
  }

  if (filters.blockedOnly && data.status !== "blocked") {
    return false;
  }

  if (filters.unassignedOnly && associatedIds.length > 0) {
    return false;
  }

  return true;
}

export function getFilteredFlowElements(
  nodes: AppNode[],
  edges: AppEdge[],
  filters: TabFilters | undefined,
  context: FilterContext,
): FilteredFlowElements {
  const activeFilters = filters ?? {};
  const baseNodes = nodes.filter((node) => matchesFilters(node, activeFilters, context));
  const baseNodeIds = new Set(baseNodes.map((node) => node.id));
  const baseEdges = edges.filter((edge) => {
    const legacyRelation = (edge.data as AppEdge["data"] & { relation?: string }).relation;

    if (activeFilters.hideRelatedEdges && legacyRelation === "related") {
      return false;
    }

    return baseNodeIds.has(edge.source) && baseNodeIds.has(edge.target);
  });

  if (!activeFilters.orphansOnly) {
    return {
      nodes: baseNodes,
      edges: baseEdges,
      visiblePlanningNodeCount: baseNodes.filter((node) => node.type === "planningNode").length,
    };
  }

  const connectedNodeIds = new Set<string>();
  baseEdges.forEach((edge) => {
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  });

  const orphanNodes = baseNodes.filter((node) => node.type === "stageBand" || !connectedNodeIds.has(node.id));
  const orphanNodeIds = new Set(orphanNodes.map((node) => node.id));

  return {
    nodes: orphanNodes,
    edges: baseEdges.filter((edge) => orphanNodeIds.has(edge.source) && orphanNodeIds.has(edge.target)),
    visiblePlanningNodeCount: orphanNodes.filter((node) => node.type === "planningNode").length,
  };
}

export function hasActiveFilters(filters: TabFilters | undefined) {
  if (!filters) {
    return false;
  }

  return Object.entries(filters).some(([_key, value]) => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }

    return Boolean(value);
  });
}
