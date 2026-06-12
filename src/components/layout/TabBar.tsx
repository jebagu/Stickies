import { Plus, Pencil, Trash2 } from "lucide-react";
import { isPublicViewMode } from "../../lib/appMode";
import { useProjectStore } from "../../state/projectStore";
import { Button } from "../ui/Button";
import { useDialog } from "../ui/DialogProvider";

export function TabBar() {
  const dialog = useDialog();
  const { project, viewMode, activeTabId, setActiveTab, createTab, renameTab, deleteTab } = useProjectStore();
  const presentationMode = project.settings.presentationMode;
  const readOnly = isPublicViewMode(viewMode);

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

  async function handleRenameTab() {
    const activeTab = project.tabs.find((tab) => tab.id === activeTabId);

    if (!activeTab) {
      return;
    }

    const name = await dialog.prompt({
      title: "Rename tab",
      defaultValue: activeTab.name,
      confirmLabel: "Rename",
    });

    if (name?.trim()) {
      renameTab(activeTab.id, name.trim());
    }
  }

  async function handleDeleteTab() {
    const activeTab = project.tabs.find((tab) => tab.id === activeTabId);

    if (!activeTab) {
      return;
    }

    if (project.tabs.length <= 1) {
      await dialog.alert({
        title: "Cannot delete tab",
        message: "The last tab cannot be deleted.",
      });
      return;
    }

    if (
      await dialog.confirm({
        title: "Delete tab",
        message: `Delete "${activeTab.name}"? This removes its canvas nodes and edges.`,
        confirmLabel: "Delete",
        danger: true,
      })
    ) {
      deleteTab(activeTab.id);
    }
  }

  return (
    <nav className="tab-bar" aria-label="Planning tabs">
      <div className="tab-bar__tabs">
        {project.tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={tab.id === activeTabId ? "tab-bar__tab tab-bar__tab--active" : "tab-bar__tab"}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.name}
          </button>
        ))}
      </div>
      {presentationMode || readOnly ? null : (
        <div className="tab-bar__actions">
          <Button aria-label="Add tab" onClick={handleAddTab}>
            <Plus size={16} aria-hidden="true" />
          </Button>
          <Button aria-label="Rename active tab" onClick={handleRenameTab}>
            <Pencil size={16} aria-hidden="true" />
          </Button>
          <Button aria-label="Delete active tab" variant="danger" onClick={handleDeleteTab}>
            <Trash2 size={16} aria-hidden="true" />
          </Button>
        </div>
      )}
    </nav>
  );
}
