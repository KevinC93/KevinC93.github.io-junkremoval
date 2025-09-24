+import { triggerMoneyRain } from "./background.js";
+
+const LAYER_ID = "leprechaun-layer";
+const RESPAWN_DELAY = 20000;
+const LEPRECHAUN_COUNT = 5;
+
+const positions = [
+  { x: 12, y: 18 },
+  { x: 78, y: 24 },
+  { x: 20, y: 68 },
+  { x: 60, y: 72 },
+  { x: 40, y: 42 },
+];
+
+const state = new Map();
+let rainLocked = false;
+
+function createLepElement(index) {
+  const lep = document.createElement("button");
+  lep.type = "button";
+  lep.className = "leprechaun";
+  lep.dataset.state = "idle";
+  lep.setAttribute("aria-live", "polite");
+  lep.innerHTML = `<span>Luck ${index + 1}</span><div class="leprechaun__sparkle" aria-hidden="true"></div>`;
+  return lep;
+}
+
+function placeLep(lep, position) {
+  lep.style.left = `${position.x}%`;
+  lep.style.top = `${position.y}%`;
+}
+
+function randomOffset(value, variance = 10) {
+  const offset = (Math.random() - 0.5) * variance;
+  return Math.min(92, Math.max(8, value + offset));
+}
+
+function scheduleRespawn(id, lep) {
+  const timer = window.setTimeout(() => {
+    lep.dataset.state = "idle";
+    lep.classList.remove("exploded");
+    const base = positions[id % positions.length];
+    placeLep(lep, {
+      x: randomOffset(base.x, 12),
+      y: randomOffset(base.y, 12),
+    });
+    lep.style.transform = "scale(1)";
+    state.set(id, { status: "idle", timer: null });
+    rainLocked = false;
+  }, RESPAWN_DELAY);
+  state.set(id, { status: "respawning", timer });
+}
+
+function tryTriggerMoneyRain() {
+  const allExploded = Array.from(state.values()).every(
+    (entry) => entry.status === "exploded",
+  );
+  if (allExploded && !rainLocked) {
+    rainLocked = true;
+    triggerMoneyRain();
+  }
+}
+
+function explodeLep(id, lep) {
+  const entry = state.get(id);
+  if (!entry || entry.status === "exploded") return;
+
+  if (entry.timer) {
+    clearTimeout(entry.timer);
+  }
+
+  lep.dataset.state = "exploding";
+  lep.style.transform = "scale(1.15)";
+
+  window.setTimeout(() => {
+    lep.dataset.state = "exploded";
+    lep.style.transform = "scale(0.6)";
+    state.set(id, { status: "exploded", timer: null });
+    tryTriggerMoneyRain();
+    scheduleRespawn(id, lep);
+  }, 520);
+}
+
+export function initLeprechauns() {
+  const layer = document.getElementById(LAYER_ID);
+  if (!layer) return;
+
+  const fragment = document.createDocumentFragment();
+
+  for (let i = 0; i < LEPRECHAUN_COUNT; i += 1) {
+    const lep = createLepElement(i);
+    const base = positions[i % positions.length];
+    placeLep(lep, {
+      x: randomOffset(base.x, 6),
+      y: randomOffset(base.y, 6),
+    });
+
+    lep.addEventListener("pointerdown", () => explodeLep(i, lep));
+    lep.addEventListener("keydown", (event) => {
+      if (event.key === "Enter" || event.key === " ") {
+        event.preventDefault();
+        explodeLep(i, lep);
+      }
+    });
+
+    state.set(i, { status: "idle", timer: null });
+    fragment.appendChild(lep);
+  }
+
+  layer.appendChild(fragment);
+}
