export type CellKind = "interior" | "frontier";

export interface CrystalCell {
  q: number;
  r: number;
  kind: CellKind;
  phase: number;
  weight: number;
}

export interface SceneEvent {
  id: string;
  type: "local-intervention" | "damage" | "history";
  x: number;
  y: number;
  startedAt: number;
}

export interface ReplayFrame {
  t: number;
  cells: CrystalCell[];
  events?: SceneEvent[];
}

export interface ExperimentReplay {
  id: string;
  title: string;
  description: string;
  source?: string;
  frames: ReplayFrame[];
}

export function hexDistance(q: number, r: number): number {
  const s = -q - r;
  return Math.max(Math.abs(q), Math.abs(r), Math.abs(s));
}

function hash2(q: number, r: number): number {
  const x = Math.sin(q * 12.9898 + r * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function makeFixtureCrystal(radius = 10): CrystalCell[] {
  const cells: CrystalCell[] = [];

  for (let q = -radius; q <= radius; q += 1) {
    for (let r = -radius; r <= radius; r += 1) {
      const distance = hexDistance(q, r);
      if (distance > radius) continue;

      cells.push({
        q,
        r,
        kind: distance === radius ? "frontier" : "interior",
        phase: hash2(q, r) * Math.PI * 2,
        weight: 0.75 + hash2(r, q) * 0.25,
      });
    }
  }

  return cells;
}
