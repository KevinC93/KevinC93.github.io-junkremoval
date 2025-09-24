 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a//dev/null b/assets/js/background.js
index 0000000000000000000000000000000000000000..caba2f7fc688751ee482438cdae998dc364c944c 100644
--- a//dev/null
+++ b/assets/js/background.js
@@ -0,0 +1,176 @@
+const canvas = document.getElementById("background-canvas");
+const ctx = canvas?.getContext("2d", { alpha: false });
+const moneyRainLayer = document.getElementById("money-rain");
+
+let heartProgress = 0;
+let targetProgress = 0;
+let rafId;
+
+const HEART_STEPS = 520;
+const pen = {
+  x: 0,
+  y: 0,
+};
+
+function resizeCanvas() {
+  if (!canvas || !ctx) return;
+  const { innerWidth, innerHeight, devicePixelRatio = 1 } = window;
+  const dpr = Math.min(2, devicePixelRatio);
+  canvas.width = innerWidth * dpr;
+  canvas.height = innerHeight * dpr;
+  canvas.style.width = `${innerWidth}px`;
+  canvas.style.height = `${innerHeight}px`;
+  ctx.setTransform(1, 0, 0, 1, 0, 0);
+  ctx.scale(dpr, dpr);
+  drawHeart(heartProgress);
+}
+
+function heartPoint(t, scale, offsetX, offsetY) {
+  const x = scale * 16 * Math.pow(Math.sin(t), 3) + offsetX;
+  const y =
+    scale *
+      (13 * Math.cos(t) -
+        5 * Math.cos(2 * t) -
+        2 * Math.cos(3 * t) -
+        Math.cos(4 * t)) +
+    offsetY;
+  return { x, y };
+}
+
+function drawHeart(progress) {
+  if (!canvas || !ctx) return;
+  const { width, height } = canvas;
+  ctx.save();
+  ctx.clearRect(0, 0, width, height);
+
+  const gradient = ctx.createLinearGradient(0, 0, 0, height);
+  gradient.addColorStop(0, "#f8fafc");
+  gradient.addColorStop(1, "#e2e8f0");
+  ctx.fillStyle = gradient;
+  ctx.fillRect(0, 0, width, height);
+  ctx.restore();
+
+  ctx.save();
+  ctx.lineWidth = 3;
+  ctx.lineJoin = "round";
+  ctx.lineCap = "round";
+
+  const scale = Math.min(width, height) / 50;
+  const offsetX = width / 2;
+  const offsetY = height / 2.3;
+  const steps = Math.max(4, Math.floor(progress * HEART_STEPS));
+
+  if (steps > 0) {
+    ctx.beginPath();
+    for (let i = 0; i <= steps; i += 1) {
+      const t = (Math.PI * 2 * i) / HEART_STEPS;
+      const { x, y } = heartPoint(t, scale, offsetX, offsetY);
+      if (i === 0) {
+        ctx.moveTo(x, y);
+      } else {
+        ctx.lineTo(x, y);
+      }
+      if (i === steps) {
+        pen.x = x;
+        pen.y = y;
+      }
+    }
+    ctx.strokeStyle = "#ff2a6f";
+    ctx.stroke();
+
+    ctx.shadowColor = "rgba(255, 42, 111, 0.3)";
+    ctx.shadowBlur = 20;
+    ctx.lineWidth = 6;
+    ctx.globalAlpha = 0.3;
+    ctx.stroke();
+    ctx.globalAlpha = 1;
+    ctx.shadowBlur = 0;
+  }
+
+  drawPen(progress);
+  ctx.restore();
+}
+
+function drawPen(progress) {
+  if (!ctx || progress <= 0) return;
+  ctx.save();
+  ctx.translate(pen.x, pen.y);
+  ctx.fillStyle = "#111827";
+  ctx.beginPath();
+  ctx.ellipse(0, 0, 12, 6, 0, 0, Math.PI * 2);
+  ctx.fill();
+
+  ctx.fillStyle = "#facc15";
+  ctx.beginPath();
+  ctx.moveTo(0, 0);
+  ctx.lineTo(24, -14);
+  ctx.lineTo(18, 8);
+  ctx.closePath();
+  ctx.fill();
+  ctx.restore();
+}
+
+function handleScroll() {
+  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
+  if (docHeight <= 0) {
+    targetProgress = 1;
+    return;
+  }
+  targetProgress = Math.min(1, window.scrollY / docHeight);
+}
+
+function animate() {
+  heartProgress += (targetProgress - heartProgress) * 0.08;
+  drawHeart(heartProgress);
+  rafId = requestAnimationFrame(animate);
+}
+
+export function triggerMoneyRain(duration = 6000) {
+  if (!moneyRainLayer) return;
+  const start = performance.now();
+  const spawnInterval = 140;
+  const bills = [];
+  moneyRainLayer.classList.add("is-active");
+
+  function spawnBill() {
+    const now = performance.now();
+    if (now - start > duration) {
+      return;
+    }
+    const bill = document.createElement("div");
+    bill.className = "bill";
+    bill.textContent = "$100";
+    bill.style.left = `${Math.random() * 100}%`;
+    const fallDuration = 4000 + Math.random() * 2400;
+    bill.style.animationDuration = `${fallDuration}ms`;
+    bill.style.transform = `rotate(${(Math.random() - 0.5) * 20}deg)`;
+    moneyRainLayer.appendChild(bill);
+    bills.push(bill);
+
+    bill.addEventListener("animationend", () => {
+      bill.remove();
+    });
+
+    setTimeout(spawnBill, spawnInterval + Math.random() * 120);
+  }
+
+  spawnBill();
+
+  setTimeout(() => {
+    bills.forEach((bill) => bill.remove());
+    moneyRainLayer.classList.remove("is-active");
+  }, duration + 5000);
+}
+
+export function initHeartCanvas() {
+  if (!canvas || !ctx) return;
+  resizeCanvas();
+  handleScroll();
+  window.addEventListener("resize", resizeCanvas);
+  window.addEventListener("scroll", handleScroll, { passive: true });
+  rafId = requestAnimationFrame(animate);
+}
+
+window.addEventListener("beforeunload", () => {
+  if (rafId) cancelAnimationFrame(rafId);
+});
 
EOF
)
