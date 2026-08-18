import "./styles.css";

import { canonicalFiniteBudgetReplay } from "./replay";
import { CrystalScene, type DemoMode } from "./scene";

const app = document.querySelector<HTMLElement>("#app");
if (!app) throw new Error("Missing #app root");

const replay = canonicalFiniteBudgetReplay;

app.innerHTML = `
  <section class="hero">
    <div class="hero-copy">
      <p class="eyebrow">DIGITAL LIFE · INTERACTIVE EXPERIMENT</p>
      <h1>Touch it here.<br /><span>Something changes over there.</span></h1>
      <p class="lede">
        A persistent computational process with a frontier, a past, and consequences
        that do not stay where an intervention begins.
      </p>
    </div>

    <div class="experiment-shell">
      <div class="scene" id="scene" aria-label="Interactive digital crystal">
        <canvas id="crystal"></canvas>
        <svg id="overlay" aria-hidden="true"></svg>
        <div class="scene-vignette"></div>
        <div class="scene-hint" id="scene-hint">Choose an experiment below</div>
      </div>

      <div class="controls" role="group" aria-label="Crystal experiments">
        <button class="control active" data-mode="observe">
          <span class="control-index">01</span>
          <span><strong>Observe</strong><small>Watch the process continue</small></span>
        </button>
        <button class="control" data-mode="intervene">
          <span class="control-index">02</span>
          <span><strong>Intervene</strong><small>Canonical Ch14 finite-budget replay</small></span>
        </button>
        <button class="control" data-mode="damage">
          <span class="control-index">03</span>
          <span><strong>Damage</strong><small>Prototype: remove material and watch return</small></span>
        </button>
        <button class="control" data-mode="history">
          <span class="control-index">04</span>
          <span><strong>History</strong><small>Prototype: the past alters the future</small></span>
        </button>
      </div>
    </div>

    <div class="evidence-strip" id="evidence-strip"></div>

    <p class="prototype-note" id="prototype-note">
      The finite-budget intervention is now a scientific replay from the book's canonical experiment.
      Observe, damage, and history still use development fixtures while their replay exports are added.
    </p>
  </section>
`;

const sceneElement = document.querySelector<HTMLElement>("#scene");
const canvas = document.querySelector<HTMLCanvasElement>("#crystal");
const svg = document.querySelector<SVGSVGElement>("#overlay");
const hint = document.querySelector<HTMLElement>("#scene-hint");
const evidence = document.querySelector<HTMLElement>("#evidence-strip");
if (!sceneElement || !canvas || !svg || !hint || !evidence) {
  throw new Error("Demo scene failed to mount");
}

const scene = new CrystalScene(canvas, svg);

const hints: Record<DemoMode, string> = {
  observe: "The crystal is a process, not a still image.",
  intervene: "Replay a measured local intervention under a fixed global evaluation budget.",
  damage: "Click to remove material. This scene is still a visual prototype.",
  history: "Click to imprint a history trace. This scene is still a visual prototype.",
};

const genericEvidence = `
  <div><span>PROCESS</span><strong>ongoing</strong></div>
  <div><span>FRONTIER</span><strong>active</strong></div>
  <div><span>INTERVENTION</span><strong>local</strong></div>
  <div><span>CONSEQUENCE</span><strong>distributed</strong></div>
`;

const canonicalEvidence = `
  <div><span>CANONICAL RUN</span><strong>seed ${replay.provenance.representativeSeed}</strong></div>
  <div><span>FINITE B</span><strong>${replay.finiteBudget.budget} slots · f=${replay.finiteBudget.fraction.toFixed(2)}</strong></div>
  <div><span>MEAN E<sub>far</sub></span><strong>${replay.measurements.meanEFar.toFixed(3)} · n=${replay.measurements.groups}</strong></div>
  <div><span>FULL EVALUATION</span><strong>${replay.measurements.fullEvaluationEFar.toFixed(3)} · ${replay.measurements.fullEvaluationHardZero}</strong></div>
`;

evidence.innerHTML = genericEvidence;

const resize = (): void => {
  const rect = sceneElement.getBoundingClientRect();
  scene.resize(rect.width, rect.height);
};

new ResizeObserver(resize).observe(sceneElement);
resize();

let lastInteraction = performance.now();
let lastReplayStage = "";

function updateModeUI(mode: DemoMode): void {
  evidence.innerHTML = mode === "intervene" ? canonicalEvidence : genericEvidence;
  document.querySelectorAll<HTMLButtonElement>(".control").forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === mode);
  });
}

function setMode(mode: DemoMode, triggerPreset = false): void {
  scene.setMode(mode);
  hint.textContent = hints[mode];
  lastReplayStage = "";
  updateModeUI(mode);
  if (triggerPreset && mode !== "observe") scene.triggerPreset(mode);
  lastInteraction = performance.now();
}

document.querySelectorAll<HTMLButtonElement>(".control").forEach((button) => {
  button.addEventListener("click", () => {
    const mode = button.dataset.mode as DemoMode;
    setMode(mode, mode !== "observe");
  });
});

sceneElement.addEventListener("pointerdown", (event) => {
  if (scene.getMode() === "observe") {
    setMode("intervene");
  }
  const rect = sceneElement.getBoundingClientRect();
  scene.trigger(event.clientX - rect.left, event.clientY - rect.top);
  lastInteraction = performance.now();
});

function frame(now: number): void {
  scene.render(now);

  const replayStatus = scene.getCanonicalReplayStatus(now);
  if (replayStatus && replayStatus.stage.id !== lastReplayStage) {
    hint.textContent = `${replayStatus.stage.label} — ${replayStatus.stage.description}`;
    lastReplayStage = replayStatus.stage.id;
  }

  if (scene.getMode() === "observe" && now - lastInteraction > 2600) {
    setMode("intervene", true);
  } else if (scene.getMode() !== "observe" && now - lastInteraction > 9500) {
    setMode("observe");
  }

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
