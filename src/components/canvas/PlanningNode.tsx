import { memo } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { useProjectStore } from "../../state/projectStore";
import type { PlanningNodeData } from "../../types/planning";
import { clsx } from "clsx";

type PlanningFlowNode = Node<PlanningNodeData, "planningNode">;

function PlanningNodeComponent({ data, selected, isConnectable }: NodeProps<PlanningFlowNode>) {
  const project = useProjectStore((state) => state.project);
  const associatedIds = data.associatedIds ?? [];
  const handleMode = project.settings.nodeHandleMode ?? "side";
  const associated = associatedIds
    .map((associatedId) => project.people.find((person) => person.id === associatedId))
    .filter(Boolean);
  const note = data.notes?.trim();

  return (
    <article className={clsx("planning-node", selected && "planning-node--selected")}>
      <Handle
        id="target-left"
        className="planning-node__handle planning-node__handle--target planning-node__handle--left"
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
      />
      {handleMode === "all-sides" ? (
        <Handle
          id="target-top"
          className="planning-node__handle planning-node__handle--target planning-node__handle--top"
          type="target"
          position={Position.Top}
          isConnectable={isConnectable}
        />
      ) : null}
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
        id="source-right"
        className="planning-node__handle planning-node__handle--source planning-node__handle--right"
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
      />
      {handleMode === "all-sides" ? (
        <Handle
          id="source-bottom"
          className="planning-node__handle planning-node__handle--source planning-node__handle--bottom"
          type="source"
          position={Position.Bottom}
          isConnectable={isConnectable}
        />
      ) : null}
    </article>
  );
}

export const PlanningNode = memo(PlanningNodeComponent);
