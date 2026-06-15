import { memo } from "react";
import type { Node, NodeProps } from "@xyflow/react";
import { clsx } from "clsx";
import type { StageBandData } from "../../types/planning";

type StageBandFlowNode = Node<StageBandData, "stageBand">;

function StageBandNodeComponent({ data, width, height }: NodeProps<StageBandFlowNode>) {
  const isHorizontal = data.orientation === "horizontal";

  return (
    <section className={clsx("stage-band", isHorizontal && "stage-band--horizontal")} style={{ width, height }}>
      <div className="stage-band__header">
        <span>{data.title}</span>
        <span className="stage-band__lock">{isHorizontal ? "Lane" : "Stage"}</span>
      </div>
    </section>
  );
}

export const StageBandNode = memo(StageBandNodeComponent);
