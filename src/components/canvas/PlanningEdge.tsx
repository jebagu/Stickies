import { memo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  type Edge,
  type EdgeProps,
} from "@xyflow/react";
import { useProjectStore } from "../../state/projectStore";
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
  const routingMode = useProjectStore((state) => state.project.settings.edgeRoutingMode ?? "bezier");
  const pathParams = {
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  };
  const [edgePath, labelX, labelY] =
    routingMode === "straight"
      ? getStraightPath(pathParams)
      : routingMode === "smooth-step"
        ? getSmoothStepPath(pathParams)
        : getBezierPath(pathParams);
  const lineType = data?.lineType ?? "solid";
  const className = [
    "planning-edge",
    `planning-edge--${lineType}`,
    selected ? "planning-edge--selected" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const label = data?.label?.trim();

  return (
    <>
      <BaseEdge id={id} path={edgePath} className={className} markerEnd={markerEnd} />
      {label ? (
        <EdgeLabelRenderer>
          <span
            className="planning-edge-label"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            {label}
          </span>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}

export const PlanningEdge = memo(PlanningEdgeComponent);
