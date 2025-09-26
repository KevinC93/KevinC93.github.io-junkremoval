const canvas = document.getElementById("aurora-canvas");
const ctx = canvas?.getContext("2d", { alpha: true });
const moneyRainLayer = document.getElementById("money-rain");

const MAX_DPR = 2;
const palette = [
  { fill: "rgba(14, 165, 233, 0.26)", stroke: "rgba(14, 165, 233, 0.55)" },
  { fill: "rgba(236, 72, 153, 0.22)", stroke: "rgba(236, 72, 153, 0.6)" },
  { fill: "rgba(22, 163, 74, 0.2)", stroke: "rgba(22, 163, 74, 0.58)" },
  { fill: "rgba(250, 204, 21, 0.18)", stroke: "rgba(217, 119, 6, 0.55)" },
];

let shapes = [];
let animationFrameId = 0;
let lastTimestamp = 0;
let canvasRect = null;
const pointer = { x: null, y: null };

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
  const count = Math.min(48, Math.max(18, Math.round(area / 42000)));
  shapes = Array.from({ length: count }, () => {
    const color = palette[Math.floor(Math.random() * palette.length)];
    const baseRadius = randomBetween(26, 72);
    return {
      x: randomBetween(0, width),
      y: randomBetween(0, height),
      vx: randomBetween(-0.012, 0.012),
      vy: randomBetween(-0.016, 0.016),
      wobble: Math.random() * Math.PI * 2,
      drift: randomBetween(8, 28),
      speed: randomBetween(0.00025, 0.0006),
      baseRadius,
      alpha: randomBetween(0.18, 0.32),
      color,
      type: ["orb", "diamond", "ring", "triangle"][Math.floor(Math.random() * 4)],
      active: false,
      radiusBoost: 0,
    };
  });
}

function drawBackground(width, height) {
  if (!ctx) return;
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(1, "#eef2ff");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function drawShape(shape, time) {
  if (!ctx) return;
  const pulse = Math.sin(time * shape.speed + shape.wobble);
  const wobbleX = Math.cos(time * shape.speed * 2 + shape.wobble) * shape.drift;
  const wobbleY = Math.sin(time * shape.speed * 1.6 + shape.wobble) * shape.drift * 0.6;
  const radius = shape.baseRadius + pulse * shape.baseRadius * 0.15 + shape.radiusBoost;
  const x = shape.x + wobbleX;
  const y = shape.y + wobbleY;

  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = shape.alpha + (shape.active ? 0.15 : 0);

  switch (shape.type) {
    case "diamond":
      ctx.beginPath();
      ctx.moveTo(0, -radius * 0.8);
      ctx.lineTo(radius * 0.9, 0);
      ctx.lineTo(0, radius * 0.8);
      ctx.lineTo(-radius * 0.9, 0);
      ctx.closePath();
      ctx.fillStyle = shape.color.fill;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = shape.color.stroke;
      ctx.stroke();
      break;
    case "ring":
      const inner = radius * 0.55;
      const outer = radius;
      const ringGradient = ctx.createRadialGradient(0, 0, inner * 0.45, 0, 0, outer);
      ringGradient.addColorStop(0, shape.color.fill);
      ringGradient.addColorStop(1, "rgba(14, 165, 233, 0)");
      ctx.fillStyle = ringGradient;
      ctx.beginPath();
      ctx.arc(0, 0, outer, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, inner, 0, Math.PI * 2);
      ctx.strokeStyle = shape.color.stroke;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      break;
    case "triangle":
      ctx.beginPath();
      ctx.moveTo(0, -radius * 0.9);
      ctx.lineTo(radius, radius * 0.9);
      ctx.lineTo(-radius, radius * 0.9);
      ctx.closePath();
      ctx.fillStyle = shape.color.fill;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = shape.color.stroke;
      ctx.stroke();
      break;
    default: {
      const orbGradient = ctx.createRadialGradient(0, 0, radius * 0.1, 0, 0, radius);
      orbGradient.addColorStop(0, "rgba(255, 255, 255, 0.9)");
      orbGradient.addColorStop(0.35, shape.color.fill);
      orbGradient.addColorStop(1, "rgba(14, 165, 233, 0)");
      ctx.fillStyle = orbGradient;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }

  if (shape.active) {
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = shape.color.stroke;
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.arc(0, 0, radius + 6, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function updateShapes(delta, width, height) {
  shapes.forEach((shape) => {
    const speedFactor = delta * 0.055;
    shape.x += shape.vx * speedFactor;
    shape.y += shape.vy * speedFactor;

    if (shape.x < -80) shape.x = width + 80;
    if (shape.x > width + 80) shape.x = -80;
    if (shape.y < -80) shape.y = height + 80;
    if (shape.y > height + 80) shape.y = -80;

    shape.vx *= 0.985;
    shape.vy *= 0.985;
    shape.radiusBoost *= 0.96;
  });
}

function activateShape(px, py) {
  if (!Number.isFinite(px) || !Number.isFinite(py) || !shapes.length) return;
  let nearest = null;
  let minDistance = Infinity;
  for (const shape of shapes) {
    const dx = px - shape.x;
    const dy = py - shape.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = shape;
    }
  }
  if (!nearest) return;
  const threshold = nearest.baseRadius * 1.6;
  if (minDistance <= threshold) {
    nearest.active = true;
    nearest.radiusBoost = Math.min(nearest.baseRadius * 0.35, nearest.radiusBoost + 8);
    nearest.vx += randomBetween(-0.25, 0.25);
    nearest.vy += randomBetween(-0.25, 0.25);
  }
}

function handlePointerMove(event) {
  if (!canvasRect) return;
  pointer.x = event.clientX - canvasRect.left;
  pointer.y = event.clientY - canvasRect.top;
  activateShape(pointer.x, pointer.y);
}

function handlePointerDown(event) {
  if (!canvasRect) return;
  const x = event.clientX - canvasRect.left;
  const y = event.clientY - canvasRect.top;
  activateShape(x, y);
}

function renderFrame(timestamp) {
  if (!canvas || !ctx) return;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const delta = Math.min(timestamp - lastTimestamp || 16, 64);
  lastTimestamp = timestamp;

  ctx.clearRect(0, 0, width, height);
  drawBackground(width, height);
  updateShapes(delta, width, height);
  shapes.forEach((shape) => drawShape(shape, timestamp));

  animationFrameId = window.requestAnimationFrame(renderFrame);
}

export function triggerMoneyRain(duration = 7000) {
  if (!moneyRainLayer) return;
  const start = performance.now();
  const bills = [];
  moneyRainLayer.classList.add("is-active");

  function spawnBill() {
    const now = performance.now();
    if (now - start > duration) {
      return;
    }
    const bill = document.createElement("div");
    bill.className = "bill";
    bill.textContent = "$100";
    bill.style.left = `${Math.random() * 100}%`;
    const fallDuration = 4600 + Math.random() * 2600;
    bill.style.setProperty("--duration", `${fallDuration}ms`);
    bill.style.setProperty("--drift", `${(Math.random() - 0.5) * 240}px`);
    moneyRainLayer.appendChild(bill);
    bills.push(bill);
    bill.addEventListener("animationend", () => {
      bill.remove();
    });

    window.setTimeout(spawnBill, 140 + Math.random() * 160);
  }

  spawnBill();

  window.setTimeout(() => {
    bills.forEach((bill) => bill.remove());
    moneyRainLayer.classList.remove("is-active");
  }, duration + 4000);
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
  });
}

window.addEventListener("beforeunload", () => {
  if (animationFrameId) {
    window.cancelAnimationFrame(animationFrameId);
  }
});
