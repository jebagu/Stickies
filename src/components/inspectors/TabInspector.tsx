import { useProjectStore } from "../../state/projectStore";
import type { PlanningTab } from "../../types/planning";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";

type TabInspectorProps = {
  tab: PlanningTab;
  readOnly?: boolean;
};

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="read-only-field">
      <span className="read-only-field__label">{label}</span>
      <span className="read-only-field__value">{value || "None"}</span>
    </div>
  );
}

export function TabInspector({ tab, readOnly = false }: TabInspectorProps) {
  const { renameTab, updateTab } = useProjectStore();

  if (readOnly) {
    return (
      <div className="inspector-stack">
        <ReadOnlyField label="Tab name" value={tab.name} />
        <ReadOnlyField label="Description" value={tab.description ?? ""} />
        <ReadOnlyField label="Items" value={String(tab.nodes.filter((node) => node.type === "planningNode").length)} />
        <ReadOnlyField label="Dependencies" value={String(tab.edges.length)} />
      </div>
    );
  }

  return (
    <div className="inspector-stack">
      <label className="field-label" htmlFor="tab-name">
        Tab name
      </label>
      <Input id="tab-name" value={tab.name} onChange={(event) => renameTab(tab.id, event.target.value)} />

      <label className="field-label" htmlFor="tab-description">
        Description
      </label>
      <Textarea
        id="tab-description"
        value={tab.description ?? ""}
        onChange={(event) => updateTab(tab.id, { description: event.target.value })}
      />
    </div>
  );
}
