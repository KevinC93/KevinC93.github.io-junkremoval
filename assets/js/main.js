 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a//dev/null b/assets/js/main.js
index 0000000000000000000000000000000000000000..ab4ca489f416136a10cd617ba64c76793231219b 100644
--- a//dev/null
+++ b/assets/js/main.js
@@ -0,0 +1,59 @@
+import { initHeartCanvas } from "./background.js";
+import { initLeprechauns } from "./leprechauns.js";
+import {
+  initContactForm,
+  initInteractiveGlow,
+  initScrollReveal,
+  initTimelineProgress,
+} from "./interactions.js";
+
+const state = {
+  spotsRemaining: 5,
+};
+
+const yearEl = document.getElementById("year");
+if (yearEl) {
+  yearEl.textContent = new Date().getFullYear();
+}
+
+function initFomoWidget() {
+  const claimButton = document.getElementById("claim");
+  const spotsEl = document.getElementById("spots-remaining");
+  if (!claimButton || !spotsEl) return;
+
+  try {
+    const saved = window.localStorage.getItem("kc-spots-remaining");
+    if (saved) {
+      state.spotsRemaining = Math.max(0, Number(saved));
+      spotsEl.textContent = state.spotsRemaining.toString();
+    }
+  } catch (error) {
+    console.warn("localStorage unavailable", error);
+  }
+
+  claimButton.addEventListener("click", () => {
+    if (state.spotsRemaining === 0) return;
+    state.spotsRemaining = Math.max(0, state.spotsRemaining - 1);
+    spotsEl.textContent = state.spotsRemaining.toString();
+    try {
+      window.localStorage.setItem(
+        "kc-spots-remaining",
+        state.spotsRemaining.toString(),
+      );
+    } catch (error) {
+      console.warn("Unable to persist remaining spots", error);
+    }
+    claimButton.textContent =
+      state.spotsRemaining === 0 ? "All claimed!" : "Spot reserved";
+    claimButton.disabled = true;
+    claimButton.classList.add("secondary");
+  });
+}
+
+initFomoWidget();
+initHeartCanvas();
+initLeprechauns();
+initScrollReveal();
+initInteractiveGlow();
+initTimelineProgress();
+initContactForm();
 
EOF
)
