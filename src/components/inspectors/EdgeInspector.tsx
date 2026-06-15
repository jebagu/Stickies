import { Trash2 } from "lucide-react";
import { LINE_TYPE_OPTIONS, formatLineTypeLabel } from "../../lib/options";
import { useProjectStore } from "../../state/projectStore";
import type { AppEdge } from "../../types/planning";
import { Button } from "../ui/Button";
import { useDialog } from "../ui/DialogProvider";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { SoftwareGraphDetails } from "./SoftwareGraphDetails";

type EdgeInspectorProps = {
  edge: AppEdge;
  sourceTitle: string;
  targetTitle: string;
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

export function EdgeInspector({ edge, sourceTitle, targetTitle, readOnly = false }: EdgeInspectorProps) {
  const dialog = useDialog();
  const { updateEdge, deleteEdge } = useProjectStore();

  if (readOnly) {
    return (
      <div className="inspector-stack">
        <ReadOnlyField label="From" value={sourceTitle} />
        <ReadOnlyField label="To" value={targetTitle} />
        <ReadOnlyField label="Label" value={edge.data.label ?? ""} />
        <ReadOnlyField label="Line type" value={formatLineTypeLabel(edge.data.lineType)} />
        <SoftwareGraphDetails metadata={edge.data.softwareGraph} kindLabel="Edge kind" />
      </div>
    );
  }

  return (
    <div className="inspector-stack">
      <Button
        variant="danger"
        onClick={async () => {
          if (
            await dialog.confirm({
              title: "Delete dependency",
              message: "Delete this dependency edge?",
              confirmLabel: "Delete",
              danger: true,
            })
          ) {
            deleteEdge(edge.id);
          }
        }}
      >
        <Trash2 size={15} aria-hidden="true" />
        Delete Edge
      </Button>

      <ReadOnlyField label="From" value={sourceTitle} />
      <ReadOnlyField label="To" value={targetTitle} />

      <label className="field-label" htmlFor="edge-label">
        Label
      </label>
      <Input
        id="edge-label"
        value={edge.data.label ?? ""}
        onChange={(event) => updateEdge(edge.id, { label: event.target.value || undefined })}
      />

      <label className="field-label" htmlFor="edge-line-type">
        Line type
      </label>
      <Select
        id="edge-line-type"
        value={edge.data.lineType}
        onChange={(event) => updateEdge(edge.id, { lineType: event.target.value as typeof edge.data.lineType })}
      >
        {LINE_TYPE_OPTIONS.map((lineType) => (
          <option key={lineType} value={lineType}>
            {formatLineTypeLabel(lineType)}
          </option>
        ))}
      </Select>
      <SoftwareGraphDetails metadata={edge.data.softwareGraph} kindLabel="Edge kind" />
    </div>
  );
}
