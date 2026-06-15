import { PanelRight, PanelRightClose } from "lucide-react";
import { isPublicViewMode } from "../../lib/appMode";
import { isTabReadOnly } from "../../lib/generatedGraph";
import { useProjectStore } from "../../state/projectStore";
import { isPlanningNodeData, type AppNode } from "../../types/planning";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { EdgeInspector } from "../inspectors/EdgeInspector";
import { NodeInspector } from "../inspectors/NodeInspector";
import { TabInspector } from "../inspectors/TabInspector";

function getNodeTitle(node: AppNode | undefined) {
  return node?.data.title ?? "Unknown item";
}

export function RightInspector() {
  const { project, viewMode, activeTabId, selectedElement, setInspectorHidden } = useProjectStore();
  const activeTab = project.tabs.find((tab) => tab.id === activeTabId) ?? project.tabs[0];
  const readOnly = isPublicViewMode(viewMode) || isTabReadOnly(project, activeTab);
  const selectedNode =
    selectedElement?.type === "node"
      ? activeTab.nodes.find((node) => node.id === selectedElement.id)
      : undefined;
  const selectedEdge =
    selectedElement?.type === "edge"
      ? activeTab.edges.find((edge) => edge.id === selectedElement.id)
      : undefined;
  const selectedEdgeSource = selectedEdge
    ? activeTab.nodes.find((node) => node.id === selectedEdge.source)
    : undefined;
  const selectedEdgeTarget = selectedEdge
    ? activeTab.nodes.find((node) => node.id === selectedEdge.target)
    : undefined;

  return (
    <aside className="right-inspector">
      <div className="inspector-title">
        <div className="inspector-title__copy">
          <PanelRight size={18} aria-hidden="true" />
          <div>
            <h2>Inspector</h2>
            <p>{selectedElement?.type ?? "tab"}</p>
          </div>
        </div>
        <Button
          className="icon-button"
          variant="ghost"
          aria-label="Hide inspector"
          title="Hide inspector"
          onClick={() => setInspectorHidden(true)}
        >
          <PanelRightClose size={16} aria-hidden="true" />
        </Button>
      </div>

      {selectedNode ? (
        <>
          <Badge>{isPlanningNodeData(selectedNode.data) ? "Item" : "stage"}</Badge>
          <NodeInspector node={selectedNode} readOnly={readOnly} />
        </>
      ) : selectedEdge ? (
        <EdgeInspector
          edge={selectedEdge}
          sourceTitle={getNodeTitle(selectedEdgeSource)}
          targetTitle={getNodeTitle(selectedEdgeTarget)}
          readOnly={readOnly}
        />
      ) : (
        <TabInspector tab={activeTab} readOnly={readOnly} />
      )}
    </aside>
  );
}
