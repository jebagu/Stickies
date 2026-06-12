import { memo } from "react";
import type { Node, NodeProps } from "@xyflow/react";
import type { StageBandData } from "../../types/planning";

type StageBandFlowNode = Node<StageBandData, "stageBand">;

function StageBandNodeComponent({ data, width, height }: NodeProps<StageBandFlowNode>) {
  return (
    <section className="stage-band" style={{ width, height }}>
      <div className="stage-band__header">
        <span>{data.title}</span>
        <span className="stage-band__lock">Stage</span>
      </div>
    </section>
  );
}

export const StageBandNode = memo(StageBandNodeComponent);
