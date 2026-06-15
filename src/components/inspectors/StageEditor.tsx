import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Columns3, Minus, Plus, Rows3, Trash2 } from "lucide-react";
import {
  GRID_SIZE,
  MIN_SWIM_LANE_HEIGHT,
  MIN_STAGE_WIDTH,
  createStageColumnRect,
  createSwimLaneRect,
  getTabOrientation,
  normalizeSwimLaneHeight,
  normalizeStageWidth,
  normalizeStagesForLayout,
  rebuildStageBandNodes,
} from "../../lib/stageLayout";
import { useProjectStore } from "../../state/projectStore";
import type { AppNode, PlanningTab, Stage } from "../../types/planning";
import { isPlanningNodeData } from "../../types/planning";
import { slugId } from "../../utils/id";
import { Button } from "../ui/Button";
import { useDialog } from "../ui/DialogProvider";
import { Input } from "../ui/Input";

type StageEditorProps = {
  tab: PlanningTab;
};

function getPlanningNodes(tab: PlanningTab) {
  return tab.nodes.filter((node) => node.type !== "stageBand");
}

export function StageEditor({ tab }: StageEditorProps) {
  const dialog = useDialog();
  const updateTab = useProjectStore((state) => state.updateTab);
  const setTabOrientation = useProjectStore((state) => state.setTabOrientation);
  const tabOrientation = getTabOrientation(tab.orientation);
  const isHorizontal = tabOrientation === "horizontal";
  const orderedStages = normalizeStagesForLayout(tab.stages, tabOrientation);

  function commitStages(nextStages: Stage[], planningNodes: AppNode[] = getPlanningNodes(tab)) {
    const stages = normalizeStagesForLayout(nextStages, tabOrientation);

    updateTab(tab.id, {
      orientation: tabOrientation,
      stages,
      nodes: rebuildStageBandNodes(tab, stages, planningNodes, tabOrientation),
    });
  }

  function updateStageName(stageId: string, name: string) {
    commitStages(orderedStages.map((stage) => (stage.id === stageId ? { ...stage, name } : stage)));
  }

  async function addStage() {
    const name = await dialog.prompt({
      title: "New stage name",
      defaultValue: "New Stage",
      confirmLabel: "Add Stage",
    });

    if (!name?.trim()) {
      return;
    }

    const nextStage: Stage = {
      id: slugId("stage", name),
      name: name.trim(),
      order: orderedStages.length,
      colorToken: `stage-${orderedStages.length + 1}`,
    };
    const rect = isHorizontal
      ? createSwimLaneRect(orderedStages.length)
      : createStageColumnRect(orderedStages.length);

    commitStages([
      ...orderedStages,
      {
        ...nextStage,
        rect,
        orientationRects: {
          [tabOrientation]: rect,
        },
      },
    ]);
  }

  async function deleteStage(stageId: string) {
    if (
      !(await dialog.confirm({
        title: "Delete stage",
        message: "Delete this stage and remove it from nodes?",
        confirmLabel: "Delete",
        danger: true,
      }))
    ) {
      return;
    }

    const stages = orderedStages.filter((stage) => stage.id !== stageId);
    const planningNodes = getPlanningNodes(tab).map((node) => {
      if (node.type === "planningNode" && isPlanningNodeData(node.data) && node.data.stageId === stageId) {
        return {
          ...node,
          data: {
            ...node.data,
            stageId: undefined,
          },
        };
      }

      return node;
    });

    commitStages(stages, planningNodes);
  }

  function moveStage(stageId: string, direction: -1 | 1) {
    const stageIndex = orderedStages.findIndex((stage) => stage.id === stageId);
    const nextIndex = stageIndex + direction;

    if (stageIndex < 0 || nextIndex < 0 || nextIndex >= orderedStages.length) {
      return;
    }

    const stages = [...orderedStages];
    const stage = stages[stageIndex];

    stages[stageIndex] = stages[nextIndex];
    stages[nextIndex] = stage;
    commitStages(stages.map((nextStage, order) => ({ ...nextStage, order })));
  }

  function resizeStage(stageId: string, delta: number) {
    commitStages(
      orderedStages.map((stage) => {
        if (stage.id !== stageId) {
          return stage;
        }

        const rect = stage.rect ?? (isHorizontal ? createSwimLaneRect(stage.order) : createStageColumnRect(stage.order));

        if (isHorizontal) {
          const height = Math.max(MIN_SWIM_LANE_HEIGHT, normalizeSwimLaneHeight(rect.height) + delta);

          return {
            ...stage,
            rect: {
              ...rect,
              height,
            },
            orientationRects: {
              ...stage.orientationRects,
              horizontal: {
                ...rect,
                height,
              },
            },
          };
        }

        const width = Math.max(MIN_STAGE_WIDTH, normalizeStageWidth(rect.width) + delta);

        return {
          ...stage,
          rect: {
            ...rect,
            width,
          },
          orientationRects: {
            ...stage.orientationRects,
            vertical: {
              ...rect,
              width,
            },
          },
        };
      }),
    );
  }

  return (
    <section className="field-group stage-editor">
      <div className="inspector-section-header">
        <h3>{isHorizontal ? "Lanes" : "Stages"}</h3>
        <Button onClick={addStage}>
          <Plus size={15} aria-hidden="true" />
          Add
        </Button>
      </div>
      <div className="stage-editor-orientation" role="group" aria-label="Band orientation">
        <button
          type="button"
          className={tabOrientation === "vertical" ? "is-active" : undefined}
          aria-pressed={tabOrientation === "vertical"}
          onClick={() => setTabOrientation(tab.id, "vertical")}
        >
          <Columns3 size={14} aria-hidden="true" />
          Stages
        </button>
        <button
          type="button"
          className={isHorizontal ? "is-active" : undefined}
          aria-pressed={isHorizontal}
          onClick={() => setTabOrientation(tab.id, "horizontal")}
        >
          <Rows3 size={14} aria-hidden="true" />
          Lanes
        </button>
      </div>
      <div className="stage-editor-list">
        {orderedStages.map((stage, index) => {
          const width = normalizeStageWidth(stage.rect?.width);
          const height = normalizeSwimLaneHeight(stage.rect?.height);
          const size = isHorizontal ? height : width;

          return (
            <div key={stage.id} className="stage-editor-card">
              <div className="stage-editor-row">
                <Input value={stage.name} onChange={(event) => updateStageName(stage.id, event.target.value)} />
                <Button variant="ghost" aria-label={`Delete ${stage.name}`} onClick={() => deleteStage(stage.id)}>
                  <Trash2 size={15} aria-hidden="true" />
                </Button>
              </div>
              <div className="stage-editor-controls">
                <div className="stage-editor-controls__group">
                  <Button
                    variant="ghost"
                    aria-label={`Move ${stage.name} ${isHorizontal ? "up" : "left"}`}
                    disabled={index === 0}
                    onClick={() => moveStage(stage.id, -1)}
                  >
                    {isHorizontal ? (
                      <ChevronUp size={15} aria-hidden="true" />
                    ) : (
                      <ChevronLeft size={15} aria-hidden="true" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    aria-label={`Move ${stage.name} ${isHorizontal ? "down" : "right"}`}
                    disabled={index === orderedStages.length - 1}
                    onClick={() => moveStage(stage.id, 1)}
                  >
                    {isHorizontal ? (
                      <ChevronDown size={15} aria-hidden="true" />
                    ) : (
                      <ChevronRight size={15} aria-hidden="true" />
                    )}
                  </Button>
                </div>
                <div className="stage-editor-controls__group stage-editor-controls__group--width">
                  <Button
                    variant="ghost"
                    aria-label={`Decrease ${stage.name} ${isHorizontal ? "height" : "width"}`}
                    disabled={isHorizontal ? size <= MIN_SWIM_LANE_HEIGHT : size <= MIN_STAGE_WIDTH}
                    onClick={() => resizeStage(stage.id, -GRID_SIZE)}
                  >
                    <Minus size={15} aria-hidden="true" />
                  </Button>
                  <span>{size}px</span>
                  <Button
                    variant="ghost"
                    aria-label={`Increase ${stage.name} ${isHorizontal ? "height" : "width"}`}
                    onClick={() => resizeStage(stage.id, GRID_SIZE)}
                  >
                    <Plus size={15} aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
