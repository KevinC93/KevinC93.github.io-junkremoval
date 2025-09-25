const canvas = document.getElementById("aurora-canvas");
const ctx = canvas?.getContext("2d", { alpha: true });
const moneyRainLayer = document.getElementById("money-rain");

const MAX_DPR = 2;
const ribbons = [];
const particles = [];
let animationFrameId;
let lastTimestamp = 0;

function createRibbons(count = 4) {
  ribbons.length = 0;
  for (let i = 0; i < count; i += 1) {
    ribbons.push({
      amplitude: 120 + Math.random() * 140,
      frequency: 0.6 + Math.random() * 0.4,
      speed: 0.4 + Math.random() * 0.4,
      hue: 190 + Math.random() * 110,
      lightness: 58 + Math.random() * 10,
      offsetY: -160 + Math.random() * 320,
      phase: Math.random() * Math.PI * 2,
    });
  }
}

function createParticles(count = 80, width = 0, height = 0) {
  particles.length = 0;
  for (let i = 0; i < count; i += 1) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 1.2 + Math.random() * 2.5,
      velocityX: -0.2 + Math.random() * 0.4,
      velocityY: 10 + Math.random() * 16,
      drift: -0.5 + Math.random() * 1,
      alpha: 0.15 + Math.random() * 0.45,
    });
  }
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
  createRibbons();
  createParticles(particles.length || 80, innerWidth, innerHeight);
}

function drawBackground(width, height) {
  if (!ctx) return;
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "rgba(15, 23, 42, 0.35)");
  gradient.addColorStop(1, "rgba(2, 6, 23, 0.92)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function drawRibbons(width, height, time) {
  if (!ctx) return;
  ribbons.forEach((ribbon, index) => {
    const hueShift = (Math.sin(time * 0.0003 + index) + 1) * 12;
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, `hsla(${ribbon.hue + hueShift}, 100%, ${ribbon.lightness}%, 0.22)`);
    gradient.addColorStop(1, `hsla(${ribbon.hue + hueShift * 1.5}, 100%, ${ribbon.lightness - 10}%, 0.05)`);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    const waveOffset = (time * 0.0004 * ribbon.speed + ribbon.phase) % (Math.PI * 2);
    const startY = height / 2 + ribbon.offsetY;
    ctx.moveTo(-width * 0.1, startY);
    const steps = 32;
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      const x = -width * 0.1 + width * 1.2 * t;
      const wave = Math.sin(t * Math.PI * ribbon.frequency + waveOffset);
      const wobble = Math.sin(time * 0.0012 + t * 18 + index) * 36;
      const y = startY + wave * ribbon.amplitude + wobble;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width * 1.3, height + 160);
    ctx.lineTo(-width * 0.2, height + 160);
    ctx.closePath();
    ctx.fill();
  });
}

function drawParticles(width, height, delta) {
  if (!ctx) return;
  particles.forEach((particle) => {
    particle.y -= particle.velocityY * (delta / 1000);
    particle.x += particle.velocityX * (delta / 16);
    particle.velocityX += particle.drift * 0.002;

    if (particle.y < -40) {
      particle.y = height + Math.random() * 80;
      particle.x = Math.random() * width;
      particle.velocityX = -0.2 + Math.random() * 0.4;
    }

    if (particle.x < -40) particle.x = width + 40;
    if (particle.x > width + 40) particle.x = -40;

    ctx.globalAlpha = particle.alpha;
    const gradient = ctx.createRadialGradient(
      particle.x,
      particle.y,
      0,
      particle.x,
      particle.y,
      particle.size * 6,
    );
    gradient.addColorStop(0, "rgba(148, 163, 184, 0.9)");
    gradient.addColorStop(1, "rgba(148, 163, 184, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function renderFrame(timestamp) {
  if (!canvas || !ctx) return;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const delta = timestamp - lastTimestamp || 16;
  lastTimestamp = timestamp;

  ctx.clearRect(0, 0, width, height);
  drawBackground(width, height);
  drawRibbons(width, height, timestamp);
  drawParticles(width, height, delta);

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
    const fallDuration = 4500 + Math.random() * 2600;
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
}

window.addEventListener("beforeunload", () => {
  if (animationFrameId) {
    window.cancelAnimationFrame(animationFrameId);
  }
});
