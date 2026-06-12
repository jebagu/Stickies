import { memo } from "react";
import { BaseEdge, getBezierPath, type Edge, type EdgeProps } from "@xyflow/react";
import type { AppEdge } from "../../types/planning";

type PlanningFlowEdge = Edge<AppEdge["data"], "planningEdge">;

function PlanningEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  markerEnd,
}: EdgeProps<PlanningFlowEdge>) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  const lineType = data?.lineType ?? "solid";
  const className = [
    "planning-edge",
    `planning-edge--${lineType}`,
    selected ? "planning-edge--selected" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <BaseEdge id={id} path={edgePath} className={className} markerEnd={markerEnd} />
  );
}

export const PlanningEdge = memo(PlanningEdgeComponent);
