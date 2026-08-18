import rawReplay from "./data/ch14-finite-budget-redistribution.json";

export type AxialCell = readonly [number, number];

export interface ReplayStage {
  id: "checkpoint" | "local" | "finite" | "full";
  label: string;
  durationMs: number;
  description: string;
}

export interface CanonicalReplay {
  schemaVersion: 1;
  id: string;
  title: string;
  chapter: {
    current: number;
    researchLineage: number;
  };
  provenance: {
    sourceRepository: string;
    visualScript: string;
    experimentScript: string;
    currentChapter: string;
    representativeSeed: number;
    steps: number;
    inputValue: number;
    maxRadius: number;
    note: string;
  };
  checkpoint: {
    occupied: AxialCell[];
  };
  intervention: {
    cell: AxialCell;
    fcp: number;
    causalRadius: number;
  };
  frontier: {
    prevent: AxialCell[];
    force: AxialCell[];
  };
  finiteBudget: {
    fraction: number;
    budget: number;
    preventSelected: AxialCell[];
    forceSelected: AxialCell[];
    farSwappedIn: AxialCell[];
    farSwappedOut: AxialCell[];
  };
  measurements: {
    fcpClass: number;
    groups: number;
    meanActualDeltaF: number;
    meanEFar: number;
    meanEFarCi95: AxialCell;
    lowBudgetScaling: string;
    fullEvaluationHardZero: string;
    fullEvaluationEFar: number;
  };
  stages: ReplayStage[];
}

export interface ReplayStatus {
  stage: ReplayStage;
  stageIndex: number;
  stageElapsedMs: number;
  cycleElapsedMs: number;
  cycleDurationMs: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isCell(value: unknown): value is AxialCell {
  return Array.isArray(value) && value.length === 2 && value.every((part) => typeof part === "number");
}

function assertReplay(value: unknown): asserts value is CanonicalReplay {
  if (!isRecord(value) || value.schemaVersion !== 1) {
    throw new Error("Unsupported canonical replay schema");
  }

  const checkpoint = value.checkpoint;
  const intervention = value.intervention;
  const finiteBudget = value.finiteBudget;
  const stages = value.stages;

  if (!isRecord(checkpoint) || !Array.isArray(checkpoint.occupied) || !checkpoint.occupied.every(isCell)) {
    throw new Error("Replay checkpoint geometry is invalid");
  }

  if (!isRecord(intervention) || !isCell(intervention.cell)) {
    throw new Error("Replay intervention is invalid");
  }

  if (!isRecord(finiteBudget) || typeof finiteBudget.budget !== "number") {
    throw new Error("Replay finite-budget data is invalid");
  }

  if (!Array.isArray(stages) || stages.length === 0) {
    throw new Error("Replay stages are missing");
  }
}

const replay: unknown = rawReplay;
assertReplay(replay);

export const canonicalFiniteBudgetReplay = replay;

export function replayStatus(replayData: CanonicalReplay, startedAt: number, now: number): ReplayStatus {
  const cycleDurationMs = replayData.stages.reduce((sum, stage) => sum + stage.durationMs, 0);
  const cycleElapsedMs = Math.max(0, now - startedAt) % cycleDurationMs;
  let cursor = 0;

  for (let index = 0; index < replayData.stages.length; index += 1) {
    const stage = replayData.stages[index];
    if (cycleElapsedMs < cursor + stage.durationMs) {
      return {
        stage,
        stageIndex: index,
        stageElapsedMs: cycleElapsedMs - cursor,
        cycleElapsedMs,
        cycleDurationMs,
      };
    }
    cursor += stage.durationMs;
  }

  const stage = replayData.stages[replayData.stages.length - 1];
  return {
    stage,
    stageIndex: replayData.stages.length - 1,
    stageElapsedMs: stage.durationMs,
    cycleElapsedMs,
    cycleDurationMs,
  };
}
