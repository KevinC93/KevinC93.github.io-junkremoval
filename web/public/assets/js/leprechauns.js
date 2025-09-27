import { triggerMoneyRain } from "./background.js";

const LAYER_ID = "leprechaun-layer";
const LEPRECHAUN_COUNT = 3;
const RESPAWN_DELAY = 20000;
const SPEED_STEP = 2;
const MAX_SPEED = 0.11;

const supportsPointerEvents = window.PointerEvent !== undefined;
const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

const SPRITE_TEMPLATE = `
  <span class="leprechaun__sprite" aria-hidden="true">
    <svg viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg" role="presentation">
      <defs>
        <linearGradient id="lep-hat" x1="0" x2="1" y1="0.25" y2="1">
          <stop offset="0" stop-color="#064e3b" />
          <stop offset="1" stop-color="#047857" />
        </linearGradient>
        <linearGradient id="lep-coat" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stop-color="#065f46" />
          <stop offset="1" stop-color="#0f5132" />
        </linearGradient>
        <linearGradient id="lep-pot" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#111827" />
          <stop offset="1" stop-color="#1f2937" />
        </linearGradient>
      </defs>
      <g class="leprechaun__shadow">
        <ellipse cx="70" cy="118" rx="34" ry="10" fill="rgba(2,14,23,0.22)" />
      </g>
      <g class="leprechaun__hat">
        <path d="M32 28h76v22c0 9.5-17 17-38 17s-38-7.5-38-17z" fill="url(#lep-hat)" />
        <rect x="24" y="44" width="92" height="14" rx="6" fill="#033f2d" />
        <rect x="46" y="47" width="48" height="8" rx="3" fill="#facc15" />
        <rect x="60" y="47" width="20" height="8" rx="3" fill="#b45309" />
      </g>
      <g class="leprechaun__face">
        <circle cx="70" cy="58" r="20" fill="#fde4c8" />
        <path class="leprechaun__beard" d="M48 62c0 14 12 26 22 26s22-12 22-26c0-6-2-8-4-8-3 0-4 4-10 4-6 0-8-4-12-4-4 0-6 4-10 4-3 0-4-4-7-4-2 0-3 2-3 8z" fill="#f97316" />
        <circle cx="62" cy="58" r="3.6" fill="#0f172a" />
        <circle cx="78" cy="58" r="3.6" fill="#0f172a" />
        <path d="M62 71c6 4 10 4 16 0" stroke="#fb923c" stroke-width="3" stroke-linecap="round" />
        <path d="M54 52c4-4 8-5 12-3" stroke="#0f172a" stroke-width="2.4" stroke-linecap="round" />
        <path d="M86 52c-4-4-8-5-12-3" stroke="#0f172a" stroke-width="2.4" stroke-linecap="round" />
        <path d="M70 63c2 2 2 5 0 7" stroke="#f97316" stroke-width="2" stroke-linecap="round" />
      </g>
      <g class="leprechaun__body">
        <path d="M38 88c-3-22 10-42 32-42s35 20 32 42c-2 17-15 28-32 28s-30-11-32-28z" fill="url(#lep-coat)" />
        <rect x="58" y="72" width="24" height="28" rx="6" fill="#facc15" />
        <rect x="60" y="74" width="20" height="14" rx="4" fill="#f97316" />
        <circle class="leprechaun__button" cx="70" cy="92" r="2.8" fill="#0f172a" />
        <circle class="leprechaun__button" cx="70" cy="102" r="2.4" fill="#0f172a" />
      </g>
      <g class="leprechaun__arm" transform="translate(34 76)">
        <path d="M0 0c8-6 18-6 26 0l-4 8-12 6z" fill="#065f46" />
        <circle cx="1" cy="8" r="4" fill="#fde4c8" />
      </g>
      <g class="leprechaun__arm" transform="translate(106 76) scale(-1 1)">
        <path d="M0 0c8-6 18-6 26 0l-4 8-12 6z" fill="#065f46" />
        <circle cx="1" cy="8" r="4" fill="#fde4c8" />
      </g>
      <g class="leprechaun__coinpot" transform="translate(50 90)">
        <path d="M20 4c14 0 24 10 24 20s-10 20-24 20-26-9-24-24z" fill="url(#lep-pot)" />
        <ellipse cx="20" cy="4" rx="18" ry="6" fill="#1f2937" />
        <g fill="#facc15" opacity="0.65">
          <circle cx="12" cy="8" r="3" />
          <circle cx="20" cy="6" r="4" />
          <circle cx="28" cy="9" r="3" />
        </g>
      </g>
      <g class="leprechaun__leg leprechaun__leg--right" transform="translate(56 90)">
        <path d="M0 0c8 4 12 6 12 20 0 6-1 12-2 18h-10z" fill="#065f46" />
        <path class="leprechaun__boot" d="M10 38h18c3 0 3 7-6 9H2l2-9z" fill="#1f2937" />
      </g>
      <g class="leprechaun__leg leprechaun__leg--left" transform="translate(78 90)">
        <path d="M0 0c8 4 12 6 12 20 0 6-1 12-2 18h-10z" fill="#047857" />
        <path class="leprechaun__boot" d="M10 38h18c3 0 3 7-6 9H2l2-9z" fill="#111827" />
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
  explode(lep);
  triggerMoneyRain(6000);
}

function update(timestamp) {
  const delta = Math.min((timestamp - lastFrame) || 16, 48);
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

  const baseSpeed = reduceMotionQuery.matches ? 0.016 : 0.028;

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

