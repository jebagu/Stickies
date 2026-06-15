import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  Panel,
  ReactFlow,
  type Connection,
  type EdgeTypes,
  type NodeMouseHandler,
  type NodeTypes,
  type OnMoveEnd,
  type EdgeMouseHandler,
  useUpdateNodeInternals,
} from "@xyflow/react";
import { RefreshCw } from "lucide-react";
import { PlanningEdge } from "./PlanningEdge";
import { PlanningNode } from "./PlanningNode";
import { StageBandNode } from "./StageBandNode";
import { getFilteredFlowElements } from "../../lib/filters";
import { isPublicViewMode } from "../../lib/appMode";
import { isTabLayoutLocked, isTabReadOnly } from "../../lib/generatedGraph";
import { getReactFlowColorMode } from "../../lib/theme";
import { useProjectStore } from "../../state/projectStore";
import type { AppEdge, AppNode } from "../../types/planning";
import { Button } from "../ui/Button";

const nodeTypes = {
  planningNode: PlanningNode,
  stageBand: StageBandNode,
} satisfies NodeTypes;

const edgeTypes = {
  planningEdge: PlanningEdge,
} satisfies EdgeTypes;

type ArrowRecomputePanelProps = {
  activeTabId: string;
  edgeRoutingMode: string;
  nodeHandleMode: string;
  planningNodeIds: string[];
  onRecompute: () => void;
};

function ArrowRecomputePanel({
  activeTabId,
  edgeRoutingMode,
  nodeHandleMode,
  planningNodeIds,
  onRecompute,
}: ArrowRecomputePanelProps) {
  const updateNodeInternals = useUpdateNodeInternals();

  const recomputeArrows = useCallback(() => {
    window.requestAnimationFrame(() => {
      updateNodeInternals(planningNodeIds);
      onRecompute();
    });
  }, [onRecompute, planningNodeIds, updateNodeInternals]);

  useEffect(() => {
    recomputeArrows();
  }, [activeTabId, edgeRoutingMode, nodeHandleMode, recomputeArrows]);

  return (
    <Panel position="top-right" className="arrow-routing-panel">
      <Button
        className="arrow-routing-panel__button"
        onClick={recomputeArrows}
        title="Recompute arrow paths"
      >
        <RefreshCw size={15} aria-hidden="true" />
        Recompute arrows
      </Button>
    </Panel>
  );
}

export function PlanningCanvas() {
  const {
    project,
    viewMode,
    activeTabId,
    applyNodesChange,
    applyEdgesChange,
    createEdge,
    setViewport,
    setSelectedElement,
  } = useProjectStore();
  const [edgeRefreshKey, setEdgeRefreshKey] = useState(0);
  const activeTab = project.tabs.find((tab) => tab.id === activeTabId) ?? project.tabs[0];
  const showMiniMap = project.settings.showMiniMap;
  const colorMode = getReactFlowColorMode(project.settings.themeId);
  const edgeRoutingMode = project.settings.edgeRoutingMode ?? "bezier";
  const nodeHandleMode = project.settings.nodeHandleMode ?? "side";
  const publicView = isPublicViewMode(viewMode);
  const contentReadOnly = publicView || isTabReadOnly(project, activeTab);
  const layoutLocked = !publicView && isTabLayoutLocked(project, activeTab);
  const defaultEdgeOptions = useMemo(
    () => ({
      type: "planningEdge" as const,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "var(--edge-stroke)",
      },
    }),
    [],
  );

  const filteredElements = useMemo(
    () =>
      getFilteredFlowElements(activeTab.nodes, activeTab.edges, activeTab.filters, {
        people: project.people,
        workstreams: project.workstreams,
        tags: project.tags,
      }),
    [activeTab.edges, activeTab.filters, activeTab.nodes, project.people, project.tags, project.workstreams],
  );

  const nodes = useMemo<AppNode[]>(
    () =>
      filteredElements.nodes.map((node) =>
        node.type === "stageBand"
          ? {
              ...node,
              draggable: false,
              selectable: false,
              zIndex: -10,
            }
          : {
              ...node,
              draggable: layoutLocked ? false : (node.draggable ?? true),
              deletable: contentReadOnly ? false : node.deletable,
            },
      ),
    [contentReadOnly, filteredElements.nodes, layoutLocked],
  );

  const edges = useMemo<AppEdge[]>(
    () =>
      filteredElements.edges.map((edge) => ({
        ...edge,
        data: {
          ...edge.data,
          edgeRefreshKey,
        },
      })),
    [edgeRefreshKey, filteredElements.edges],
  );
  const planningNodeIds = useMemo(
    () => nodes.flatMap((node) => (node.type === "planningNode" ? [node.id] : [])),
    [nodes],
  );
  const bumpEdgeRefreshKey = useCallback(() => {
    setEdgeRefreshKey((current) => current + 1);
  }, []);

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        createEdge(connection.source, connection.target, connection.sourceHandle, connection.targetHandle);
      }
    },
    [createEdge],
  );

  const handleNodeClick = useCallback<NodeMouseHandler<AppNode>>(
    (_event, node) => {
      setSelectedElement({ type: "node", id: node.id });
    },
    [setSelectedElement],
  );

  const handleEdgeClick = useCallback<EdgeMouseHandler<AppEdge>>(
    (_event, edge) => {
      setSelectedElement({ type: "edge", id: edge.id });
    },
    [setSelectedElement],
  );

  const handlePaneClick = useCallback(() => {
    setSelectedElement(null);
  }, [setSelectedElement]);

  const handleMoveEnd = useCallback<OnMoveEnd>(
    (_event, viewport) => {
      setViewport(viewport);
    },
    [setViewport],
  );

  return (
    <ReactFlow<AppNode, AppEdge>
      key={activeTab.id}
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      defaultEdgeOptions={defaultEdgeOptions}
      defaultViewport={activeTab.viewport}
      colorMode={colorMode}
      nodesDraggable={!layoutLocked}
      nodesConnectable={!contentReadOnly}
      edgesReconnectable={!contentReadOnly}
      elementsSelectable
      deleteKeyCode={contentReadOnly ? null : "Backspace"}
      connectOnClick={!contentReadOnly}
      fitView={!activeTab.viewport}
      onNodesChange={applyNodesChange}
      onEdgesChange={contentReadOnly ? undefined : applyEdgesChange}
      onConnect={contentReadOnly ? undefined : handleConnect}
      onNodeClick={handleNodeClick}
      onEdgeClick={handleEdgeClick}
      onPaneClick={handlePaneClick}
      onMoveEnd={publicView ? undefined : handleMoveEnd}
    >
      <Background />
      <Controls />
      {showMiniMap ? <MiniMap pannable zoomable /> : null}
      <ArrowRecomputePanel
        activeTabId={activeTab.id}
        edgeRoutingMode={edgeRoutingMode}
        nodeHandleMode={nodeHandleMode}
        planningNodeIds={planningNodeIds}
        onRecompute={bumpEdgeRefreshKey}
      />
    </ReactFlow>
  );
}
