import "./styles.css";

import { CrystalScene, type DemoMode } from "./scene";

const app = document.querySelector<HTMLElement>("#app");
if (!app) throw new Error("Missing #app root");

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
          <span><strong>Intervene</strong><small>Local cause → far-field change</small></span>
        </button>
        <button class="control" data-mode="damage">
          <span class="control-index">03</span>
          <span><strong>Damage</strong><small>Remove material and watch return</small></span>
        </button>
        <button class="control" data-mode="history">
          <span class="control-index">04</span>
          <span><strong>History</strong><small>The past alters the future</small></span>
        </button>
      </div>
    </div>

    <div class="evidence-strip">
      <div><span>PROCESS</span><strong>ongoing</strong></div>
      <div><span>FRONTIER</span><strong>active</strong></div>
      <div><span>INTERVENTION</span><strong>local</strong></div>
      <div><span>CONSEQUENCE</span><strong>distributed</strong></div>
    </div>

    <p class="prototype-note">
      Visual-engine prototype. The next milestone replaces fixture dynamics with replay data
      exported from the book's canonical experiments.
    </p>
  </section>
`;

const sceneElement = document.querySelector<HTMLElement>("#scene");
const canvas = document.querySelector<HTMLCanvasElement>("#crystal");
const svg = document.querySelector<SVGSVGElement>("#overlay");
const hint = document.querySelector<HTMLElement>("#scene-hint");
if (!sceneElement || !canvas || !svg || !hint) throw new Error("Demo scene failed to mount");

const scene = new CrystalScene(canvas, svg);

const hints: Record<DemoMode, string> = {
  observe: "The crystal is a process, not a still image.",
  intervene: "Click anywhere on the crystal to apply a local intervention.",
  damage: "Click to remove material. Watch the process refill the wound.",
  history: "Click to imprint a history trace without replacing the geometry.",
};

const resize = (): void => {
  const rect = sceneElement.getBoundingClientRect();
  scene.resize(rect.width, rect.height);
};

new ResizeObserver(resize).observe(sceneElement);
resize();

let lastInteraction = performance.now();

function setMode(mode: DemoMode, triggerPreset = false): void {
  scene.setMode(mode);
  hint.textContent = hints[mode];
  document.querySelectorAll<HTMLButtonElement>(".control").forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === mode);
  });
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

  if (scene.getMode() === "observe" && now - lastInteraction > 2600) {
    scene.triggerPreset("intervene", now);
    hint.textContent = "A tiny local intervention redistributes opportunities far away.";
    lastInteraction = now;
  } else if (now - lastInteraction > 9000) {
    setMode("observe");
  }

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
