import { Plus, SquarePlus } from "lucide-react";
import { StageEditor } from "../inspectors/StageEditor";
import { isTabReadOnly } from "../../lib/generatedGraph";
import {
  EDGE_ROUTING_OPTIONS,
  NODE_HANDLE_OPTIONS,
  formatEdgeRoutingLabel,
  formatNodeHandleModeLabel,
} from "../../lib/options";
import { useProjectStore } from "../../state/projectStore";
import type { EdgeRoutingMode, NodeHandleMode } from "../../types/planning";
import { Button } from "../ui/Button";
import { useDialog } from "../ui/DialogProvider";
import { Select } from "../ui/Select";
import { FileMenu } from "./FileMenu";

export function LeftSidebar() {
  const dialog = useDialog();
  const { activeTabId, createNode, createTab, project, setEdgeRoutingMode, setNodeHandleMode } = useProjectStore();
  const activeTab = project.tabs.find((tab) => tab.id === activeTabId) ?? project.tabs[0];
  const tabReadOnly = isTabReadOnly(project, activeTab);

  async function handleAddTab() {
    const name = await dialog.prompt({
      title: "New tab name",
      defaultValue: "New Planning Tab",
      confirmLabel: "Add Tab",
    });

    if (name?.trim()) {
      createTab(name.trim());
    }
  }

  return (
    <aside className="left-sidebar">
      <FileMenu />
      <section className="left-sidebar__controls">
        <Button className="w-full" disabled={tabReadOnly} onClick={() => createNode({})}>
          <SquarePlus size={15} aria-hidden="true" />
          Add Item
        </Button>
        <div className="left-sidebar__connector-controls" aria-label="Connector settings">
          <label className="left-sidebar__field">
            <span>Connector type</span>
            <Select
              aria-label="Connector type"
              value={project.settings.edgeRoutingMode ?? "bezier"}
              onChange={(event) => setEdgeRoutingMode(event.target.value as EdgeRoutingMode)}
            >
              {EDGE_ROUTING_OPTIONS.map((routingMode) => (
                <option key={routingMode} value={routingMode}>
                  {formatEdgeRoutingLabel(routingMode)}
                </option>
              ))}
            </Select>
          </label>
          <label className="left-sidebar__field">
            <span>Handle locations</span>
            <Select
              aria-label="Handle locations"
              value={project.settings.nodeHandleMode ?? "side"}
              onChange={(event) => setNodeHandleMode(event.target.value as NodeHandleMode)}
            >
              {NODE_HANDLE_OPTIONS.map((handleMode) => (
                <option key={handleMode} value={handleMode}>
                  {formatNodeHandleModeLabel(handleMode)}
                </option>
              ))}
            </Select>
          </label>
        </div>
        <div className="left-sidebar__divider" aria-hidden="true" />
        <Button className="w-full" onClick={handleAddTab}>
          <Plus size={15} aria-hidden="true" />
          Add Tab
        </Button>
      </section>
      {tabReadOnly ? <p className="meta-copy">Generated graph tabs are read-only.</p> : <StageEditor tab={activeTab} />}
    </aside>
  );
}
