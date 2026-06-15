import { Plus, SquarePlus } from "lucide-react";
import { StageEditor } from "../inspectors/StageEditor";
import { isTabReadOnly } from "../../lib/generatedGraph";
import { useProjectStore } from "../../state/projectStore";
import { Button } from "../ui/Button";
import { useDialog } from "../ui/DialogProvider";
import { FileMenu } from "./FileMenu";

export function LeftSidebar() {
  const dialog = useDialog();
  const { activeTabId, createNode, createTab, project } = useProjectStore();
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
        <Button className="w-full" onClick={handleAddTab}>
          <Plus size={15} aria-hidden="true" />
          Add Tab
        </Button>
      </section>
      {tabReadOnly ? <p className="meta-copy">Generated graph tabs are read-only.</p> : <StageEditor tab={activeTab} />}
    </aside>
  );
}
