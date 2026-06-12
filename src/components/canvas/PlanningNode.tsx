import { memo } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { useProjectStore } from "../../state/projectStore";
import type { PlanningNodeData } from "../../types/planning";
import { clsx } from "clsx";

type PlanningFlowNode = Node<PlanningNodeData, "planningNode">;

function PlanningNodeComponent({ data, selected, isConnectable }: NodeProps<PlanningFlowNode>) {
  const project = useProjectStore((state) => state.project);
  const associatedIds = data.associatedIds ?? [];
  const associated = associatedIds
    .map((associatedId) => project.people.find((person) => person.id === associatedId))
    .filter(Boolean);
  const note = data.notes?.trim();

  return (
    <article className={clsx("planning-node", selected && "planning-node--selected")}>
      <Handle
        className="planning-node__handle planning-node__handle--target"
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
      />
      <h3 className="planning-node__title">{data.title}</h3>
      {note ? <p className="planning-node__note">{note}</p> : null}
      <div className="planning-node__footer">
        <div className="planning-node__associated-list" aria-label="Associated">
          {associated.slice(0, 4).map((person) => (
            <span key={person?.id} className="planning-node__associated">
              {person?.initials}
            </span>
          ))}
        </div>
      </div>
      <Handle
        className="planning-node__handle planning-node__handle--source"
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
      />
    </article>
  );
}

export const PlanningNode = memo(PlanningNodeComponent);
