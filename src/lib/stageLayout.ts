import type { AppNode, PlanningTab, Stage, StageRect, TabOrientation } from "../types/planning";

export const GRID_SIZE = 40;
export const STAGE_GAP = 20;
export const DEFAULT_STAGE_WIDTH = 300;
export const MIN_STAGE_WIDTH = 260;
export const STAGE_HEIGHT = 2200;
export const SWIM_LANE_WIDTH = 3600;
export const DEFAULT_SWIM_LANE_HEIGHT = 260;
export const MIN_SWIM_LANE_HEIGHT = 180;

export function getTabOrientation(orientation: unknown): TabOrientation {
  return orientation === "horizontal" ? "horizontal" : "vertical";
}

export function normalizeStageWidth(width: number | undefined) {
  return typeof width === "number" && Number.isFinite(width) && width >= MIN_STAGE_WIDTH
    ? width
    : DEFAULT_STAGE_WIDTH;
}

export function normalizeSwimLaneHeight(height: number | undefined) {
  return typeof height === "number" && Number.isFinite(height) && height >= MIN_SWIM_LANE_HEIGHT
    ? height
    : DEFAULT_SWIM_LANE_HEIGHT;
}

export function createStageColumnRect(order: number, width = DEFAULT_STAGE_WIDTH) {
  return { x: order * (DEFAULT_STAGE_WIDTH + STAGE_GAP), y: 0, width, height: STAGE_HEIGHT };
}

export function createSwimLaneRect(order: number, height = DEFAULT_SWIM_LANE_HEIGHT) {
  return { x: 0, y: order * (DEFAULT_SWIM_LANE_HEIGHT + STAGE_GAP), width: SWIM_LANE_WIDTH, height };
}

function getRememberedRect(stage: Stage, orientation: TabOrientation): StageRect | undefined {
  if (stage.orientationRects?.[orientation]) {
    return stage.orientationRects[orientation];
  }

  return stage.orientationRects ? undefined : stage.rect;
}

export function rememberCurrentStageRects(stages: Stage[], orientation: TabOrientation): Stage[] {
  return stages.map((stage) =>
    stage.rect
      ? {
          ...stage,
          orientationRects: {
            ...stage.orientationRects,
            [orientation]: stage.rect,
          },
        }
      : stage,
  );
}

export function normalizeStagesForLayout(stages: Stage[], orientation: TabOrientation = "vertical"): Stage[] {
  const normalizedOrientation = getTabOrientation(orientation);
  let nextX = 0;
  let nextY = 0;

  return stages
    .map((stage, index) => ({ stage, index }))
    .sort((first, second) => first.stage.order - second.stage.order || first.index - second.index)
    .map(({ stage }, order) => {
      const rememberedRect = getRememberedRect(stage, normalizedOrientation);
      const rect =
        normalizedOrientation === "horizontal"
          ? {
              x: 0,
              y: nextY,
              width: SWIM_LANE_WIDTH,
              height: normalizeSwimLaneHeight(rememberedRect?.height),
            }
          : {
              x: nextX,
              y: 0,
              width: normalizeStageWidth(rememberedRect?.width),
              height: STAGE_HEIGHT,
            };
      const nextStage = {
        ...stage,
        order,
        rect,
        orientationRects: {
          ...stage.orientationRects,
          [normalizedOrientation]: rect,
        },
      };

      nextX += rect.width + STAGE_GAP;
      nextY += rect.height + STAGE_GAP;
      return nextStage;
    });
}

export function createStageBandNode(tabId: string, stage: Stage, orientation: TabOrientation = "vertical"): AppNode {
  const normalizedOrientation = getTabOrientation(orientation);
  const rect =
    stage.rect ??
    (normalizedOrientation === "horizontal"
      ? createSwimLaneRect(stage.order)
      : createStageColumnRect(stage.order));

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
      orientation: normalizedOrientation,
      locked: true,
      colorToken: stage.colorToken,
    },
    draggable: false,
    selectable: false,
    deletable: false,
    zIndex: 0,
  };
}

export function createStageBandNodes(
  tabId: string,
  stages: Stage[],
  orientation: TabOrientation = "vertical",
): AppNode[] {
  return stages.map((stage) => createStageBandNode(tabId, stage, orientation));
}

export function rebuildStageBandNodes(
  tab: PlanningTab,
  stages: Stage[],
  planningNodes: AppNode[],
  orientation: TabOrientation = getTabOrientation(tab.orientation),
) {
  return [...createStageBandNodes(tab.id, stages, orientation), ...planningNodes];
}
