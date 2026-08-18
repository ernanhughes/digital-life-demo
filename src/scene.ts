import * as d3 from "d3";

import { makeFixtureCrystal, type CrystalCell } from "./model";
import {
  canonicalFiniteBudgetReplay,
  replayStatus,
  type AxialCell,
  type ReplayStatus,
} from "./replay";

export type DemoMode = "observe" | "intervene" | "damage" | "history";

interface ActiveEvent {
  kind: "damage" | "history";
  x: number;
  y: number;
  startedAt: number;
}

export class CrystalScene {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly svg: SVGSVGElement;
  private readonly cells: CrystalCell[];
  private readonly causalCircle: d3.Selection<SVGCircleElement, unknown, null, undefined>;
  private readonly eventLabel: d3.Selection<SVGTextElement, unknown, null, undefined>;
  private readonly farFieldLayer: d3.Selection<SVGGElement, unknown, null, undefined>;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private event: ActiveEvent | null = null;
  private replayStartedAt: number | null = null;
  private mode: DemoMode = "observe";

  constructor(canvas: HTMLCanvasElement, svg: SVGSVGElement) {
    this.canvas = canvas;
    this.svg = svg;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas is not available");
    this.ctx = ctx;
    this.cells = makeFixtureCrystal(11);

    const overlay = d3.select(svg);
    this.causalCircle = overlay
      .append("circle")
      .attr("class", "causal-zone")
      .attr("opacity", 0);
    this.farFieldLayer = overlay.append("g").attr("class", "far-field-layer");
    this.eventLabel = overlay
      .append("text")
      .attr("class", "event-label")
      .attr("text-anchor", "middle")
      .attr("opacity", 0);
  }

  setMode(mode: DemoMode): void {
    this.mode = mode;
    this.event = null;
    if (mode !== "intervene") this.replayStartedAt = null;
  }

  getMode(): DemoMode {
    return this.mode;
  }

  getCanonicalReplayStatus(now: number): ReplayStatus | null {
    if (this.mode !== "intervene" || this.replayStartedAt === null) return null;
    return replayStatus(canonicalFiniteBudgetReplay, this.replayStartedAt, now);
  }

  startCanonicalReplay(now = performance.now()): void {
    this.mode = "intervene";
    this.event = null;
    this.replayStartedAt = now;
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
    this.canvas.width = Math.round(width * this.dpr);
    this.canvas.height = Math.round(height * this.dpr);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  }

  trigger(x: number, y: number, now = performance.now()): void {
    if (this.mode === "observe") return;
    if (this.mode === "intervene") {
      this.startCanonicalReplay(now);
      return;
    }
    this.event = { kind: this.mode, x, y, startedAt: now };
  }

  triggerPreset(kind: Exclude<DemoMode, "observe">, now = performance.now()): void {
    if (kind === "intervene") {
      this.startCanonicalReplay(now);
      return;
    }

    this.mode = kind;
    this.replayStartedAt = null;
    const hexSize = this.hexSize();
    const x = this.width / 2 + hexSize * Math.sqrt(3) * 2.2;
    const y = this.height / 2 - hexSize * 8.5;
    this.event = { kind, x, y, startedAt: now };
  }

  render(now: number): void {
    if (this.mode === "intervene" && this.replayStartedAt !== null) {
      this.renderCanonicalReplay(now);
      return;
    }

    this.renderFixture(now);
  }

  private renderFixture(now: number): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    const centerX = this.width / 2;
    const centerY = this.height / 2 + Math.min(38, this.height * 0.04);
    const size = this.hexSize();
    const active = this.event;
    const elapsed = active ? now - active.startedAt : 0;

    for (const cell of this.cells) {
      const { x, y } = this.axialToPixel(cell.q, cell.r, size, centerX, centerY);
      const localDistance = active ? Math.hypot(x - active.x, y - active.y) : Number.POSITIVE_INFINITY;

      let alpha = 0.7 + Math.sin(now * 0.0016 + cell.phase) * 0.08;
      let fill = cell.kind === "frontier" ? "rgba(235,242,250,0.11)" : "rgba(110,135,163,0.18)";
      let stroke = cell.kind === "frontier" ? "rgba(212,225,239,0.52)" : "rgba(149,172,195,0.26)";
      let scale = 0.9 + Math.sin(now * 0.001 + cell.phase) * 0.025;

      if (active?.kind === "damage" && localDistance < size * 4.5) {
        const recovery = Math.max(0, Math.min(1, (elapsed - 1200) / 3200));
        alpha *= recovery;
      }

      if (active?.kind === "history") {
        const historyWave = Math.sin((cell.q * 0.55 + cell.r * 0.28) + elapsed * 0.0018);
        if (historyWave > 0.58) {
          fill = "rgba(131,111,255,0.28)";
          stroke = "rgba(174,161,255,0.5)";
        }
      }

      this.drawHex(x, y, size * scale, fill, stroke, Math.max(0, Math.min(1, alpha * cell.weight)));
    }

    this.drawFrontierActivity(now, centerX, centerY, size);
    this.renderFixtureOverlay(now, size);
  }

  private renderCanonicalReplay(now: number): void {
    if (this.replayStartedAt === null) return;

    const replay = canonicalFiniteBudgetReplay;
    const status = replayStatus(replay, this.replayStartedAt, now);
    const stage = status.stage.id;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    const centerX = this.width / 2;
    const centerY = this.height / 2 + Math.min(30, this.height * 0.035);
    const size = this.hexSize();
    const occupied = replay.checkpoint.occupied;
    const showIntervention = stage !== "checkpoint";
    const frontier = stage === "checkpoint" ? replay.frontier.prevent : replay.frontier.force;
    const stageProgress = Math.max(0, Math.min(1, status.stageElapsedMs / Math.max(1, status.stage.durationMs)));

    for (const cell of occupied) {
      const p = this.axialToPixel(cell[0], cell[1], size, centerX, centerY);
      const pulse = 0.72 + Math.sin(now * 0.0014 + cell[0] * 0.41 + cell[1] * 0.27) * 0.035;
      this.drawHex(
        p.x,
        p.y,
        size * 0.9,
        "rgba(110,135,163,0.2)",
        "rgba(149,172,195,0.3)",
        pulse,
      );
    }

    if (showIntervention) {
      const [q, r] = replay.intervention.cell;
      const p = this.axialToPixel(q, r, size, centerX, centerY);
      const arrival = Math.min(1, stageProgress * 3);
      this.drawHex(
        p.x,
        p.y,
        size * (0.9 + arrival * 0.08),
        `rgba(73,150,255,${0.2 + arrival * 0.48})`,
        `rgba(130,193,255,${0.55 + arrival * 0.4})`,
        1,
      );
    }

    for (const cell of frontier) {
      const p = this.axialToPixel(cell[0], cell[1], size, centerX, centerY);
      this.drawHex(
        p.x,
        p.y,
        size * 0.86,
        "rgba(235,242,250,0.02)",
        "rgba(212,225,239,0.28)",
        0.9,
      );
    }

    if (stage === "finite") {
      for (const cell of replay.finiteBudget.forceSelected) {
        const p = this.axialToPixel(cell[0], cell[1], size, centerX, centerY);
        this.drawCandidateDot(p.x, p.y, size * 0.16, "rgba(112,174,255,0.72)");
      }
    }

    if (stage === "full") {
      for (const cell of frontier) {
        const p = this.axialToPixel(cell[0], cell[1], size, centerX, centerY);
        this.drawCandidateDot(p.x, p.y, size * 0.1, "rgba(193,215,240,0.48)");
      }
    }

    this.renderCanonicalOverlay(status, centerX, centerY, size);
  }

  private hexSize(): number {
    return Math.max(8, Math.min(17, Math.min(this.width, this.height) / 31));
  }

  private axialToPixel(q: number, r: number, size: number, cx: number, cy: number): { x: number; y: number } {
    return {
      x: cx + size * Math.sqrt(3) * (q + r / 2),
      y: cy + size * 1.5 * r,
    };
  }

  private drawHex(x: number, y: number, size: number, fill: string, stroke: string, alpha: number): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    for (let i = 0; i < 6; i += 1) {
      const angle = Math.PI / 180 * (60 * i - 30);
      const px = x + size * Math.cos(angle);
      const py = y + size * Math.sin(angle);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  private drawCandidateDot(x: number, y: number, radius: number, fill: string): void {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
  }

  private drawFrontierActivity(now: number, cx: number, cy: number, size: number): void {
    const ctx = this.ctx;
    const frontier = this.cells.filter((cell) => cell.kind === "frontier");
    frontier.forEach((cell, index) => {
      const p = this.axialToPixel(cell.q, cell.r, size, cx, cy);
      const pulse = (Math.sin(now * 0.0022 + index * 0.83) + 1) / 2;
      if (pulse < 0.87) return;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.8 + pulse * 2.4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(214,229,246,${0.08 + pulse * 0.22})`;
      ctx.fill();
    });
  }

  private renderFixtureOverlay(now: number, size: number): void {
    const active = this.event;
    if (!active) {
      this.clearOverlay();
      return;
    }

    const elapsed = now - active.startedAt;
    const eventAge = Math.min(1, elapsed / 650);
    const fade = elapsed > 7000 ? Math.max(0, 1 - (elapsed - 7000) / 1600) : 1;
    const label = active.kind === "damage" ? "MATERIAL REMOVED" : "HISTORY IMPRINT";

    this.causalCircle
      .attr("cx", active.x)
      .attr("cy", active.y)
      .attr("r", size * (2.8 + eventAge * 2.1))
      .attr("opacity", 0.72 * fade);

    this.eventLabel
      .attr("x", active.x)
      .attr("y", active.y - size * 5.5)
      .attr("opacity", 0.9 * fade)
      .text(label);

    this.farFieldLayer.selectAll("circle").remove();
  }

  private renderCanonicalOverlay(status: ReplayStatus, cx: number, cy: number, size: number): void {
    const replay = canonicalFiniteBudgetReplay;
    const stage = status.stage.id;

    if (stage === "checkpoint") {
      this.clearOverlay();
      return;
    }

    const intervention = this.axialToPixel(
      replay.intervention.cell[0],
      replay.intervention.cell[1],
      size,
      cx,
      cy,
    );

    this.causalCircle
      .attr("cx", intervention.x)
      .attr("cy", intervention.y)
      .attr("r", size * 2.45)
      .attr("opacity", 0.78);

    const label = stage === "finite"
      ? `FINITE B = ${replay.finiteBudget.budget}`
      : stage === "full"
        ? "FULL / UNBOUNDED · FAR = 0"
        : "LOCAL INTERVENTION";

    this.eventLabel
      .attr("x", intervention.x)
      .attr("y", intervention.y - size * 3.2)
      .attr("opacity", 0.94)
      .text(label);

    if (stage !== "finite") {
      this.farFieldLayer.selectAll("circle").remove();
      return;
    }

    const points = [
      ...replay.finiteBudget.farSwappedOut.map((cell) => ({ cell, kind: "out" as const })),
      ...replay.finiteBudget.farSwappedIn.map((cell) => ({ cell, kind: "in" as const })),
    ];
    const reveal = Math.max(0, Math.min(1, status.stageElapsedMs / 700));

    this.farFieldLayer
      .selectAll<SVGCircleElement, { cell: AxialCell; kind: "in" | "out" }>("circle")
      .data(points, (point) => `${point.kind}:${point.cell[0]},${point.cell[1]}`)
      .join("circle")
      .attr("class", (point) => `far-field ${point.kind}`)
      .attr("cx", (point) => this.axialToPixel(point.cell[0], point.cell[1], size, cx, cy).x)
      .attr("cy", (point) => this.axialToPixel(point.cell[0], point.cell[1], size, cx, cy).y)
      .attr("r", 4 + reveal * 4)
      .attr("opacity", reveal * 0.95);
  }

  private clearOverlay(): void {
    this.causalCircle.attr("opacity", 0);
    this.eventLabel.attr("opacity", 0);
    this.farFieldLayer.selectAll("circle").remove();
  }
}
