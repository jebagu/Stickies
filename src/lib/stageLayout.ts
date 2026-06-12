import type { AppNode, PlanningTab, Stage } from "../types/planning";

export const GRID_SIZE = 40;
export const STAGE_GAP = 20;
export const DEFAULT_STAGE_WIDTH = 300;
export const MIN_STAGE_WIDTH = 260;
export const STAGE_HEIGHT = 2200;

export function normalizeStageWidth(width: number | undefined) {
  return typeof width === "number" && Number.isFinite(width) && width >= MIN_STAGE_WIDTH
    ? width
    : DEFAULT_STAGE_WIDTH;
}

export function createStageColumnRect(order: number, width = DEFAULT_STAGE_WIDTH) {
  return { x: order * (DEFAULT_STAGE_WIDTH + STAGE_GAP), y: 0, width, height: STAGE_HEIGHT };
}

export function normalizeStagesForLayout(stages: Stage[]): Stage[] {
  let nextX = 0;

  return stages
    .map((stage, index) => ({ stage, index }))
    .sort((first, second) => first.stage.order - second.stage.order || first.index - second.index)
    .map(({ stage }, order) => {
      const width = normalizeStageWidth(stage.rect?.width);
      const nextStage = {
        ...stage,
        order,
        rect: {
          x: nextX,
          y: 0,
          width,
          height: STAGE_HEIGHT,
        },
      };

      nextX += width + STAGE_GAP;
      return nextStage;
    });
}

export function createStageBandNode(tabId: string, stage: Stage): AppNode {
  const rect = stage.rect ?? createStageColumnRect(stage.order);

  return {
    id: `${tabId}_band_${stage.id}`,
    type: "stageBand",
    position: {
      x: rect.x,
      y: rect.y,
    },
    width: rect.width,
    height: rect.height,
    data: {
      title: stage.name,
      stageId: stage.id,
      locked: true,
      colorToken: stage.colorToken,
    },
    draggable: false,
    selectable: false,
    deletable: false,
    zIndex: 0,
  };
}

export function createStageBandNodes(tabId: string, stages: Stage[]): AppNode[] {
  return stages.map((stage) => createStageBandNode(tabId, stage));
}

export function rebuildStageBandNodes(tab: PlanningTab, stages: Stage[], planningNodes: AppNode[]) {
  return [...createStageBandNodes(tab.id, stages), ...planningNodes];
}
