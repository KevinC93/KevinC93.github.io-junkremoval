import { triggerMoneyRain } from "./background.js";

const LAYER_ID = "leprechaun-layer";
const LEPRECHAUN_COUNT = 3;
const RESPAWN_DELAY = 20000;
const SPEED_STEP = 1.25;
const MAX_SPEED = 0.055;

const supportsPointerEvents = window.PointerEvent !== undefined;
const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

const SPRITE_TEMPLATE = `
  <span class="leprechaun__sprite" aria-hidden="true">
    <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="presentation">
      <defs>
        <linearGradient id="gold-sheen" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#fef3c7" />
          <stop offset="0.45" stop-color="#f6c12a" />
          <stop offset="1" stop-color="#f59e0b" />
        </linearGradient>
        <linearGradient id="coat-shade" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stop-color="#0b7a36" />
          <stop offset="1" stop-color="#0a4d2b" />
        </linearGradient>
      </defs>
      <g fill="none" stroke="none" stroke-width="0">
        <path d="M82 19c0 11-8 18-22 18s-22-7-22-18 8-16 22-16 22 5 22 16z" fill="#065f46" />
        <rect x="44" y="24" width="32" height="10" rx="4" fill="#0f5132" />
        <path d="M54 34h12v8H54z" fill="#f59e0b" />
        <circle cx="60" cy="48" r="14" fill="#fde68a" />
        <path d="M68 62c0 4-3 6-8 6s-8-2-8-6 3-6 8-6 8 2 8 6z" fill="#ea580c" />
        <path d="M40 70c-5 12-2 26 4 33s16 11 25 9 18-9 22-19 3-22-3-29z" fill="url(#coat-shade)" />
        <path d="M66 71c-6 10-5 21 0 26s13 5 19-2 9-20 2-28z" fill="#0b7a36" />
        <path d="M24 75c9-5 24-7 34-3s18 13 23 23l-6 4c-4-8-10-14-18-17s-20-1-28 3z" fill="#0f5132" opacity="0.9" />
        <path d="M36 95l-9 12c-2 3-1 6 2 7s7-1 9-4l9-13z" fill="#1f2937" />
        <path d="M94 96l12 10c3 3 3 6 1 8s-7 2-10-1l-11-11z" fill="#1f2937" />
        <g transform="translate(62 80)">
          <path d="M20 6c10 0 18 8 18 18s-8 18-18 18-20-6-22-16 6-20 22-20z" fill="#111827" />
          <ellipse cx="20" cy="26" rx="16" ry="8" fill="#1f2937" />
          <ellipse cx="20" cy="14" rx="10" ry="5" fill="url(#gold-sheen)" class="leprechaun__shine" />
          <circle cx="10" cy="20" r="3" fill="#f6c12a" opacity="0.8" />
          <circle cx="28" cy="24" r="3" fill="#f6c12a" opacity="0.8" />
        </g>
        <path d="M86 46c1 7-3 12-10 13l-3-9z" fill="#ea580c" />
        <path d="M48 46c-1 7 3 12 10 13l3-9z" fill="#ea580c" />
        <circle cx="56" cy="44" r="2" fill="#1f2937" />
        <circle cx="64" cy="44" r="2" fill="#1f2937" />
        <path d="M54 52c2 3 5 4 8 4s6-1 8-4" stroke="#f97316" stroke-width="2.4" stroke-linecap="round" />
      </g>
    </svg>
  </span>
`;

const leprechauns = [];
const activeTimers = new Set();
let layerRef = null;
let animationId = 0;
let lastFrame = 0;
let rainLocked = false;

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function createRunner(index) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "leprechaun";
  button.setAttribute("aria-label", `Leprechaun ${index + 1} racing across the screen`);
  button.dataset.id = String(index);
  button.dataset.state = "running";
  button.dataset.direction = "right";
  button.innerHTML = SPRITE_TEMPLATE;
  return button;
}

function createVelocity(diagonal = false) {
  let angle;
  if (diagonal) {
    angle = randomBetween(Math.PI / 4, Math.PI / 2);
    if (Math.random() > 0.5) {
      angle = -angle;
    }
    if (Math.random() > 0.5) {
      angle = Math.PI - angle;
    }
  } else {
    angle = randomBetween(-0.35, 0.35);
    if (Math.random() > 0.5) {
      angle += Math.PI;
    }
  }
  const vx = Math.cos(angle);
  const vy = Math.sin(angle) * 0.75;
  return { vx, vy };
}

function setState(lep, state) {
  lep.status = state;
  lep.element.dataset.state = state;
  if (state === "hidden") {
    lep.element.style.opacity = "0";
    lep.element.style.pointerEvents = "none";
    lep.element.classList.remove("leprechaun--boosted");
  } else {
    lep.element.style.opacity = "1";
    lep.element.style.pointerEvents = "auto";
    if (state === "boosted") {
      lep.element.classList.add("leprechaun--boosted");
    } else {
      lep.element.classList.remove("leprechaun--boosted");
    }
  }
}

function applyTransform(lep) {
  lep.element.style.transform = `translate3d(${lep.x}vw, ${lep.y}vh, 0)`;
  lep.element.dataset.direction = lep.vx < 0 ? "left" : "right";
  lep.element.style.filter = lep.status === "boosted"
    ? "drop-shadow(0 22px 36px rgba(217, 119, 6, 0.45))"
    : "drop-shadow(0 18px 30px rgba(14, 116, 144, 0.28))";
}

function spawnCoin(lep, { variant = "fall", dx = 0, dy = 0, delay = 0 } = {}) {
  if (!layerRef) return;
  const coin = document.createElement("span");
  coin.className = variant === "burst" ? "leprechaun-coin leprechaun-coin--burst" : "leprechaun-coin";
  coin.style.left = `${lep.x}vw`;
  coin.style.top = `${lep.y}vh`;
  if (variant === "burst") {
    coin.style.setProperty("--dx", `${dx}px`);
    coin.style.setProperty("--dy", `${dy}px`);
  }
  if (delay) {
    coin.style.animationDelay = `${delay}ms`;
  }
  layerRef.appendChild(coin);
  coin.addEventListener("animationend", () => {
    coin.remove();
  });
}

function spawnCoinBurst(lep) {
  const bursts = reduceMotionQuery.matches ? 5 : 8;
  for (let i = 0; i < bursts; i += 1) {
    const angle = (Math.PI * 2 * i) / bursts + randomBetween(-0.4, 0.4);
    const distance = randomBetween(38, 86);
    spawnCoin(lep, {
      variant: "burst",
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance,
      delay: i * 18,
    });
  }
}

function maybeTriggerRain() {
  if (!leprechauns.length) return;
  const allHidden = leprechauns.every((entry) => entry.status === "hidden");
  if (allHidden && !rainLocked) {
    rainLocked = true;
    triggerMoneyRain();
  }
}

function scheduleRespawn(lep) {
  const timer = window.setTimeout(() => {
    activeTimers.delete(timer);
    const start = randomBetween(12, 88);
    lep.x = start;
    lep.y = randomBetween(18, 78);
    const velocity = createVelocity();
    lep.vx = velocity.vx;
    lep.vy = velocity.vy;
    lep.speed = lep.baseSpeed;
    lep.clicks = 0;
    setState(lep, "running");
    applyTransform(lep);
    rainLocked = false;
  }, RESPAWN_DELAY);
  activeTimers.add(timer);
  lep.respawnTimer = timer;
}

function explode(lep) {
  if (lep.status === "exploding" || lep.status === "hidden") return;
  setState(lep, "exploding");
  spawnCoinBurst(lep);
  window.setTimeout(() => {
    setState(lep, "hidden");
    maybeTriggerRain();
    scheduleRespawn(lep);
  }, 480);
}

function handleActivation(lep) {
  if (lep.status === "exploding" || lep.status === "hidden") return;
  lep.clicks += 1;
  spawnCoin(lep);

  if (lep.clicks === 1) {
    lep.speed = Math.min(lep.speed * SPEED_STEP, MAX_SPEED);
    setState(lep, "boosted");
  } else if (lep.clicks === 2) {
    const diagonal = createVelocity(true);
    lep.vx = diagonal.vx;
    lep.vy = diagonal.vy;
    lep.speed = Math.min(lep.speed * SPEED_STEP, MAX_SPEED);
    setState(lep, "boosted");
  } else {
    explode(lep);
  }
}

function update(timestamp) {
  const delta = Math.min(timestamp - lastFrame, 48) || 16;
  lastFrame = timestamp;

  leprechauns.forEach((lep) => {
    if (lep.status !== "running" && lep.status !== "boosted") {
      return;
    }
    const speedFactor = lep.speed * (delta / 16);
    lep.x += lep.vx * speedFactor;
    lep.y += lep.vy * speedFactor;

    if (lep.x < 4) {
      lep.x = 4;
      lep.vx *= -1;
    }
    if (lep.x > 96) {
      lep.x = 96;
      lep.vx *= -1;
    }
    if (lep.y < 12) {
      lep.y = 12;
      lep.vy = Math.abs(lep.vy);
    }
    if (lep.y > 84) {
      lep.y = 84;
      lep.vy = -Math.abs(lep.vy);
    }

    applyTransform(lep);
  });

  animationId = window.requestAnimationFrame(update);
}

function registerActivation(element, lep) {
  const handler = (event) => {
    if (event.type !== "keydown") {
      event.preventDefault();
      element.focus({ preventScroll: true });
    }
    handleActivation(lep);
  };

  if (supportsPointerEvents) {
    element.addEventListener("pointerdown", handler);
  } else {
    element.addEventListener("mousedown", handler);
    element.addEventListener(
      "touchstart",
      (event) => {
        event.preventDefault();
        handler(event);
      },
      { passive: false },
    );
  }

  element.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      handler(event);
    }
  });
}

export function initLeprechauns() {
  const layer = document.getElementById(LAYER_ID);
  if (!layer || layer.dataset.enhanced === "true") return;
  layer.dataset.enhanced = "true";
  layer.innerHTML = "";
  layer.style.pointerEvents = "none";
  layer.style.visibility = "visible";
  layer.style.opacity = "1";
  layerRef = layer;

  const baseSpeed = reduceMotionQuery.matches ? 0.018 : 0.033;

  for (let i = 0; i < LEPRECHAUN_COUNT; i += 1) {
    const runner = createRunner(i);
    const startX = randomBetween(12, 88);
    const startY = randomBetween(20, 78);
    const velocity = createVelocity();

    const lep = {
      id: i,
      element: runner,
      x: startX,
      y: startY,
      vx: velocity.vx,
      vy: velocity.vy,
      speed: baseSpeed,
      baseSpeed,
      clicks: 0,
      status: "running",
      respawnTimer: null,
    };

    applyTransform(lep);
    registerActivation(runner, lep);
    layer.appendChild(runner);
    leprechauns.push(lep);
  }

  lastFrame = performance.now();
  animationId = window.requestAnimationFrame(update);

  window.addEventListener("beforeunload", () => {
    if (animationId) {
      window.cancelAnimationFrame(animationId);
    }
    activeTimers.forEach((timer) => window.clearTimeout(timer));
    activeTimers.clear();
  });
}
