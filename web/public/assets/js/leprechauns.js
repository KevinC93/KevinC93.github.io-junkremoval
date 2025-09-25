import { triggerMoneyRain } from "./background.js";

const LAYER_ID = "leprechaun-layer";
const RESPAWN_DELAY = 22000;
const NODE_COUNT = 6;

const supportsPointerEvents = window.PointerEvent !== undefined;

const anchorPositions = [
  { x: 16, y: 24 },
  { x: 74, y: 18 },
  { x: 28, y: 64 },
  { x: 62, y: 70 },
  { x: 46, y: 42 },
  { x: 12, y: 78 },
];

const state = new Map();
let rainLocked = false;

function createTrigger(index) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "leprechaun";
  button.dataset.state = "idle";
  button.setAttribute("aria-live", "polite");
  button.innerHTML = `<span>Boost ${index + 1}</span><div class="leprechaun__sparkle" aria-hidden="true"></div>`;
  return button;
}

function addPrimaryActivation(element, handler) {
  if (supportsPointerEvents) {
    element.addEventListener("pointerdown", handler);
    return;
  }
  element.addEventListener("click", handler);
}

function applyPosition(element, position) {
  element.style.left = `${position.x}%`;
  element.style.top = `${position.y}%`;
}

function withVariance(value, variance = 12) {
  const offset = (Math.random() - 0.5) * variance;
  return Math.min(92, Math.max(8, value + offset));
}

function scheduleRespawn(id, element) {
  const timer = window.setTimeout(() => {
    element.dataset.state = "idle";
    const base = anchorPositions[id % anchorPositions.length];
    applyPosition(element, {
      x: withVariance(base.x, 18),
      y: withVariance(base.y, 18),
    });
    element.style.transform = "scale(1)";
    state.set(id, { status: "idle", timer: null });
    rainLocked = false;
  }, RESPAWN_DELAY);
  state.set(id, { status: "respawning", timer });
}

function maybeMakeItRain() {
  const allExploded = Array.from(state.values()).every(
    (entry) => entry.status === "exploded",
  );
  if (allExploded && !rainLocked) {
    rainLocked = true;
    triggerMoneyRain();
  }
}

function detonate(id, element) {
  const entry = state.get(id);
  if (!entry || entry.status === "exploded") return;

  if (entry.timer) {
    clearTimeout(entry.timer);
  }

  element.dataset.state = "exploding";
  element.style.transform = "scale(1.25) rotate(-6deg)";

  window.setTimeout(() => {
    element.dataset.state = "exploded";
    element.style.transform = "scale(0)";
    state.set(id, { status: "exploded", timer: null });
    maybeMakeItRain();
    scheduleRespawn(id, element);
  }, 520);
}

export function initLeprechauns() {
  const layer = document.getElementById(LAYER_ID);
  if (!layer) return;

  const fragment = document.createDocumentFragment();

  for (let i = 0; i < NODE_COUNT; i += 1) {
    const trigger = createTrigger(i);
    const base = anchorPositions[i % anchorPositions.length];
    applyPosition(trigger, {
      x: withVariance(base.x, 10),
      y: withVariance(base.y, 10),
    });

    addPrimaryActivation(trigger, (event) => {
      if (event.type === "click") {
        event.preventDefault();
      }
      detonate(i, trigger);
    });

    trigger.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        detonate(i, trigger);
      }
    });

    state.set(i, { status: "idle", timer: null });
    fragment.appendChild(trigger);
  }

  layer.appendChild(fragment);
}
