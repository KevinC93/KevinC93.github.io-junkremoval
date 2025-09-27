const canvas = document.getElementById("aurora-canvas");
const ctx = canvas?.getContext("2d", { alpha: true });
const moneyRainLayer = document.getElementById("money-rain");

const MAX_DPR = 2.5;
const palette = [
  { fill: "rgba(14, 165, 233, 0.28)", stroke: "rgba(14, 165, 233, 0.55)", glow: "rgba(125, 211, 252, 0.5)", type: "orb" },
  { fill: "rgba(168, 85, 247, 0.24)", stroke: "rgba(168, 85, 247, 0.52)", glow: "rgba(196, 181, 253, 0.45)", type: "diamond" },
  { fill: "rgba(236, 72, 153, 0.22)", stroke: "rgba(236, 72, 153, 0.58)", glow: "rgba(244, 114, 182, 0.4)", type: "trail" },
  { fill: "rgba(22, 163, 74, 0.22)", stroke: "rgba(22, 163, 74, 0.52)", glow: "rgba(134, 239, 172, 0.32)", type: "ring" },
];

let shapes = [];
let animationFrameId = 0;
let lastTimestamp = 0;
let canvasRect = null;
const pointer = { x: null, y: null };
const pointerTarget = { x: 0, y: 0 };
const tilt = { x: 0, y: 0 };

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function resizeCanvas() {
  if (!canvas || !ctx) return;
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
  const { innerWidth, innerHeight } = window;
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  canvas.style.width = `${innerWidth}px`;
  canvas.style.height = `${innerHeight}px`;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
  canvasRect = canvas.getBoundingClientRect();
  createShapes(innerWidth, innerHeight);
}

function createShapes(width, height) {
  const area = width * height;
  const count = Math.min(72, Math.max(30, Math.round(area / 32000)));
  shapes = Array.from({ length: count }, (_, index) => {
    const depth = randomBetween(0.15, 0.95);
    const paletteEntry = palette[index % palette.length];
    const baseRadius = randomBetween(26, 86) * (1 - depth * 0.35);
    return {
      x: randomBetween(-width * 0.1, width * 1.1),
      y: randomBetween(-height * 0.1, height * 1.1),
      vx: randomBetween(-0.015, 0.015),
      vy: randomBetween(-0.02, 0.02),
      wobble: Math.random() * Math.PI * 2,
      drift: randomBetween(12, 40),
      speed: randomBetween(0.00018, 0.00062),
      baseRadius,
      alpha: randomBetween(0.18, 0.32),
      palette: paletteEntry,
      type: paletteEntry.type === "trail" && Math.random() > 0.5 ? "spark" : paletteEntry.type,
      depth,
      spin: randomBetween(-0.002, 0.002),
      radiusBoost: 0,
      activeUntil: 0,
    };
  });
}

function drawBackground(width, height, tiltX, tiltY) {
  if (!ctx) return;
  ctx.save();
  const baseGradient = ctx.createLinearGradient(0, 0, width, height);
  baseGradient.addColorStop(0, "#f7fbff");
  baseGradient.addColorStop(0.5, "#eef2ff");
  baseGradient.addColorStop(1, "#e0f2fe");
  ctx.fillStyle = baseGradient;
  ctx.fillRect(0, 0, width, height);

  const glow = ctx.createRadialGradient(
    width * 0.2,
    height * 0.22,
    0,
    width * 0.2,
    height * 0.22,
    Math.max(width, height) * 0.95,
  );
  glow.addColorStop(0, "rgba(14,165,233,0.25)");
  glow.addColorStop(1, "rgba(14,165,233,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  const spacing = Math.max(140, Math.min(width, height) / 9);
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate((tiltY / 40) * 0.03);
  ctx.globalAlpha = 0.08;
  ctx.strokeStyle = "rgba(14, 116, 144, 0.22)";
  ctx.lineWidth = 1;
  for (let x = -width; x <= width; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x - width, -height);
    ctx.lineTo(x + width, height);
    ctx.stroke();
  }
  for (let y = -height; y <= height; y += spacing) {
    ctx.beginPath();
    ctx.moveTo(-width, y - height);
    ctx.lineTo(width, y + height);
    ctx.stroke();
  }
  ctx.restore();
}

function drawShape(shape, time, tiltX, tiltY) {
  if (!ctx) return;
  const pulse = Math.sin(time * shape.speed + shape.wobble);
  const wobbleX = Math.cos(time * shape.speed * 2 + shape.wobble) * shape.drift;
  const wobbleY = Math.sin(time * shape.speed * 1.6 + shape.wobble) * shape.drift * 0.6;
  const parallaxX = tiltY * shape.depth * 22;
  const parallaxY = tiltX * shape.depth * 22;
  const radius = shape.baseRadius + pulse * shape.baseRadius * 0.18 + shape.radiusBoost;
  const x = shape.x + wobbleX + parallaxX;
  const y = shape.y + wobbleY + parallaxY;
  const rotation = (time * shape.spin) % (Math.PI * 2);

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.globalAlpha = shape.alpha + (shape.activeUntil > time ? 0.18 : 0);

  switch (shape.type) {
    case "diamond": {
      const r = radius;
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.9);
      ctx.lineTo(r * 0.9, 0);
      ctx.lineTo(0, r * 0.9);
      ctx.lineTo(-r * 0.9, 0);
      ctx.closePath();
      ctx.fillStyle = shape.palette.fill;
      ctx.fill();
      ctx.strokeStyle = shape.palette.stroke;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      break;
    }
    case "ring": {
      const r = radius * 0.9;
      const ringGradient = ctx.createRadialGradient(0, 0, r * 0.35, 0, 0, r);
      ringGradient.addColorStop(0, shape.palette.glow);
      ringGradient.addColorStop(1, "rgba(14, 165, 233, 0)");
      ctx.strokeStyle = shape.palette.stroke;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = ringGradient;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "spark": {
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = shape.palette.glow;
      ctx.beginPath();
      ctx.moveTo(0, -radius * 0.8);
      ctx.lineTo(radius * 0.4, 0);
      ctx.lineTo(0, radius * 0.8);
      ctx.lineTo(-radius * 0.4, 0);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "trail": {
      ctx.globalCompositeOperation = "lighter";
      const gradient = ctx.createLinearGradient(-radius, 0, radius, 0);
      gradient.addColorStop(0, "rgba(255,255,255,0)");
      gradient.addColorStop(0.5, shape.palette.glow);
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 1.1, radius * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    default: {
      const orbGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
      orbGradient.addColorStop(0, "rgba(255, 255, 255, 0.9)");
      orbGradient.addColorStop(0.45, shape.palette.fill);
      orbGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = orbGradient;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = shape.palette.stroke;
      ctx.lineWidth = 1.1;
      ctx.stroke();
    }
  }

  ctx.restore();
}

function updateShapes(delta, width, height) {
  const now = performance.now();
  shapes.forEach((shape) => {
    const velocityScale = delta * (0.02 + shape.depth * 0.02);
    shape.x += shape.vx * velocityScale * width;
    shape.y += shape.vy * velocityScale * height;
    shape.wobble += shape.speed * delta;
    shape.radiusBoost = Math.max(0, shape.radiusBoost - delta * 0.02);
    if (shape.activeUntil && shape.activeUntil < now) {
      shape.activeUntil = 0;
    }

    if (
      shape.x < -width * 0.2 ||
      shape.x > width * 1.2 ||
      shape.y < -height * 0.2 ||
      shape.y > height * 1.2
    ) {
      shape.x = randomBetween(-width * 0.1, width * 1.1);
      shape.y = randomBetween(-height * 0.1, height * 1.1);
      shape.vx = randomBetween(-0.015, 0.015);
      shape.vy = randomBetween(-0.02, 0.02);
    }
  });
}

function activateShape(px, py) {
  if (!Number.isFinite(px) || !Number.isFinite(py) || !shapes.length) return;
  let closest = null;
  let minDist = Infinity;
  shapes.forEach((shape) => {
    const dx = px - shape.x;
    const dy = py - shape.y;
    const distance = Math.hypot(dx, dy);
    if (distance < minDist) {
      minDist = distance;
      closest = shape;
    }
  });
  if (!closest) return;
  const threshold = closest.baseRadius * 1.4;
  if (minDist <= threshold) {
    closest.radiusBoost = Math.min(closest.baseRadius * 0.5, closest.radiusBoost + 14);
    closest.vx += randomBetween(-0.35, 0.35);
    closest.vy += randomBetween(-0.35, 0.35);
    closest.activeUntil = performance.now() + 1400;
  }
}

function handlePointerMove(event) {
  if (!canvasRect) return;
  pointer.x = event.clientX - canvasRect.left;
  pointer.y = event.clientY - canvasRect.top;
  pointerTarget.x = pointer.x / canvasRect.width - 0.5;
  pointerTarget.y = pointer.y / canvasRect.height - 0.5;
  activateShape(pointer.x, pointer.y);
}

function handlePointerDown(event) {
  if (!canvasRect) return;
  const x = event.clientX - canvasRect.left;
  const y = event.clientY - canvasRect.top;
  pointerTarget.x = x / canvasRect.width - 0.5;
  pointerTarget.y = y / canvasRect.height - 0.5;
  activateShape(x, y);
}

function renderFrame(timestamp) {
  if (!canvas || !ctx) return;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const delta = Math.min((timestamp - lastTimestamp) || 16, 64);
  lastTimestamp = timestamp;

  tilt.x += ((pointerTarget.y || 0) * 18 - tilt.x) * 0.08;
  tilt.y += ((pointerTarget.x || 0) * 18 - tilt.y) * 0.08;

  ctx.clearRect(0, 0, width, height);
  drawBackground(width, height, tilt.x, tilt.y);
  updateShapes(delta, width, height);
  shapes.forEach((shape) => drawShape(shape, timestamp, tilt.x, tilt.y));

  animationFrameId = window.requestAnimationFrame(renderFrame);
}

export function triggerMoneyRain(duration = 7000) {
  if (!moneyRainLayer) return;
  const start = performance.now();
  const bills = new Set();
  moneyRainLayer.classList.add("is-active");

  function spawnBill() {
    const now = performance.now();
    if (now - start > duration) {
      return;
    }
    const bill = document.createElement("div");
    bill.className = "bill";
    const serial = `A${Math.floor(Math.random() * 900000 + 100000)}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;
    bill.innerHTML = `
      <span class="bill__serial">${serial}</span>
      <span class="bill__value">$100</span>
      <span class="bill__seal">USD</span>
    `;
    bill.style.left = `${Math.random() * 100}%`;
    const fallDuration = 4200 + Math.random() * 2400;
    bill.style.setProperty("--duration", `${fallDuration}ms`);
    bill.style.setProperty("--drift", `${(Math.random() - 0.5) * 280}px`);
    bill.style.setProperty("--rotate", `${(Math.random() - 0.5) * 18}deg`);
    bill.style.animationDelay = `${Math.random() * 120}ms`;
    moneyRainLayer.appendChild(bill);
    bills.add(bill);
    bill.addEventListener("animationend", () => {
      bill.remove();
      bills.delete(bill);
    });

    window.setTimeout(spawnBill, 90 + Math.random() * 140);
  }

  spawnBill();

  window.setTimeout(() => {
    bills.forEach((bill) => bill.remove());
    moneyRainLayer.classList.remove("is-active");
  }, duration + 4200);
}

export function initAuroraBackground() {
  if (!canvas || !ctx) return;
  resizeCanvas();
  lastTimestamp = performance.now();
  animationFrameId = window.requestAnimationFrame(renderFrame);
  window.addEventListener("resize", resizeCanvas);
  window.addEventListener("pointermove", handlePointerMove, { passive: true });
  window.addEventListener("pointerdown", handlePointerDown, { passive: true });
  window.addEventListener("pointerleave", () => {
    pointer.x = null;
    pointer.y = null;
    pointerTarget.x = 0;
    pointerTarget.y = 0;
  });
}

window.addEventListener("beforeunload", () => {
  if (animationFrameId) {
    window.cancelAnimationFrame(animationFrameId);
  }
});

