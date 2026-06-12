import { useCallback, useMemo } from "react";
import {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  type Connection,
  type EdgeTypes,
  type NodeMouseHandler,
  type NodeTypes,
  type OnMoveEnd,
  type EdgeMouseHandler,
} from "@xyflow/react";
import { PlanningEdge } from "./PlanningEdge";
import { PlanningNode } from "./PlanningNode";
import { StageBandNode } from "./StageBandNode";
import { getFilteredFlowElements } from "../../lib/filters";
import { isPublicViewMode } from "../../lib/appMode";
import { getReactFlowColorMode } from "../../lib/theme";
import { useProjectStore } from "../../state/projectStore";
import type { AppEdge, AppNode } from "../../types/planning";

const nodeTypes = {
  planningNode: PlanningNode,
  stageBand: StageBandNode,
} satisfies NodeTypes;

const edgeTypes = {
  planningEdge: PlanningEdge,
} satisfies EdgeTypes;

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
  const activeTab = project.tabs.find((tab) => tab.id === activeTabId) ?? project.tabs[0];
  const showMiniMap = project.settings.showMiniMap;
  const colorMode = getReactFlowColorMode(project.settings.themeId);
  const readOnly = isPublicViewMode(viewMode);
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
              draggable: node.draggable,
              deletable: readOnly ? false : node.deletable,
            },
      ),
    [filteredElements.nodes, readOnly],
  );

  const edges = useMemo<AppEdge[]>(() => filteredElements.edges, [filteredElements.edges]);

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        createEdge(connection.source, connection.target);
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
      nodesDraggable
      nodesConnectable={!readOnly}
      edgesReconnectable={!readOnly}
      elementsSelectable
      deleteKeyCode={readOnly ? null : "Backspace"}
      connectOnClick={!readOnly}
      fitView={!activeTab.viewport}
      onNodesChange={applyNodesChange}
      onEdgesChange={readOnly ? undefined : applyEdgesChange}
      onConnect={readOnly ? undefined : handleConnect}
      onNodeClick={handleNodeClick}
      onEdgeClick={handleEdgeClick}
      onPaneClick={handlePaneClick}
      onMoveEnd={readOnly ? undefined : handleMoveEnd}
    >
      <Background />
      <Controls />
      {showMiniMap ? <MiniMap pannable zoomable /> : null}
    </ReactFlow>
  );
}
