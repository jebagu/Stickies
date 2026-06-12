import { Copy, Trash2 } from "lucide-react";
import { NODE_STATUS_OPTIONS, formatOptionLabel } from "../../lib/options";
import { useProjectStore } from "../../state/projectStore";
import type { AppNode, PlanningNodeData } from "../../types/planning";
import { isPlanningNodeData } from "../../types/planning";
import { Button } from "../ui/Button";
import { useDialog } from "../ui/DialogProvider";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Textarea } from "../ui/Textarea";

type NodeInspectorProps = {
  node: AppNode;
  readOnly?: boolean;
};

function addId(values: string[] | undefined, id: string) {
  const currentValues = values ?? [];
  return currentValues.includes(id) ? currentValues : [...currentValues, id];
}

function removeId(values: string[] | undefined, id: string) {
  return (values ?? []).filter((value) => value !== id);
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="read-only-field">
      <span className="read-only-field__label">{label}</span>
      <span className="read-only-field__value">{value || "None"}</span>
    </div>
  );
}

export function NodeInspector({ node, readOnly = false }: NodeInspectorProps) {
  const dialog = useDialog();
  const { project, updateNode, deleteNode, duplicateNode } = useProjectStore();

  if (!isPlanningNodeData(node.data)) {
    return <p className="empty-inspector">Select a planning node to edit it.</p>;
  }

  const data: PlanningNodeData = node.data;
  const associatedIds = data.associatedIds ?? [];
  const workstreamName =
    project.workstreams.find((workstream) => workstream.id === data.workstreamId)?.name ?? "No workstream";
  const associatedNames = associatedIds
    .map((personId) => project.people.find((candidate) => candidate.id === personId)?.name ?? personId)
    .join(", ");

  function update(updates: Partial<PlanningNodeData>) {
    updateNode(node.id, updates);
  }

  if (readOnly) {
    return (
      <div className="inspector-stack">
        <ReadOnlyField label="Title" value={data.title} />
        <ReadOnlyField label="Note" value={data.notes ?? ""} />
        <ReadOnlyField label="Status" value={formatOptionLabel(data.status)} />
        <ReadOnlyField label="Workstream" value={workstreamName} />
        <ReadOnlyField label="Associated" value={associatedNames} />
        <ReadOnlyField label="Priority" value={data.priority ?? ""} />
        <ReadOnlyField label="Confidence" value={data.confidence ? formatOptionLabel(data.confidence) : ""} />
        <ReadOnlyField label="Target date" value={data.targetDate ?? ""} />
      </div>
    );
  }

  return (
    <div className="inspector-stack">
      <div className="inspector-actions">
        <Button onClick={() => duplicateNode(node.id)}>
          <Copy size={15} aria-hidden="true" />
          Duplicate
        </Button>
        <Button
          variant="danger"
          onClick={async () => {
            if (
              await dialog.confirm({
                title: "Delete item",
                message: `Delete "${data.title}" and its connected edges?`,
                confirmLabel: "Delete",
                danger: true,
              })
            ) {
              deleteNode(node.id);
            }
          }}
        >
          <Trash2 size={15} aria-hidden="true" />
          Delete
        </Button>
      </div>

      <label className="field-label" htmlFor="node-title">
        Title
      </label>
      <Input id="node-title" value={data.title} onChange={(event) => update({ title: event.target.value })} />

      <label className="field-label" htmlFor="node-note">
        Note
      </label>
      <Textarea
        id="node-note"
        value={data.notes ?? ""}
        onChange={(event) => update({ notes: event.target.value })}
      />

      <label className="field-label" htmlFor="node-status">
        Status
      </label>
      <Select
        id="node-status"
        value={data.status}
        onChange={(event) => update({ status: event.target.value as typeof data.status })}
      >
        {NODE_STATUS_OPTIONS.map((status) => (
          <option key={status} value={status}>
            {formatOptionLabel(status)}
          </option>
        ))}
      </Select>

      <label className="field-label" htmlFor="node-associated">
        Associated
      </label>
      <Select
        id="node-associated"
        value=""
        onChange={(event) => {
          if (event.target.value) {
            update({ associatedIds: addId(associatedIds, event.target.value) });
          }
        }}
      >
        <option value="">Add person or organization</option>
        {project.people.map((person) => (
          <option key={person.id} value={person.id}>
            {person.name}
          </option>
        ))}
      </Select>
      <div className="pill-list" aria-label="Associated items">
        {associatedIds.length > 0 ? (
          associatedIds.map((personId) => {
            const person = project.people.find((candidate) => candidate.id === personId);

            return (
              <span key={personId} className="editable-pill">
                {person?.name ?? personId}
                <button
                  type="button"
                  aria-label={`Remove ${person?.name ?? personId}`}
                  onClick={() => update({ associatedIds: removeId(associatedIds, personId) })}
                >
                  Remove
                </button>
              </span>
            );
          })
        ) : (
          <span className="meta-copy">No associated items</span>
        )}
      </div>
    </div>
  );
}
