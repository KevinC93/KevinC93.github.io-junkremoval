 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a//dev/null b/assets/js/interactions.js
index 0000000000000000000000000000000000000000..41e48beec868d051222af0122463fc7bbf57b754 100644
--- a//dev/null
+++ b/assets/js/interactions.js
@@ -0,0 +1,189 @@
+const prefersReducedMotion = window.matchMedia(
+  "(prefers-reduced-motion: reduce)",
+).matches;
+const GLOW_CLASS = "glow-active";
+
+export function initScrollReveal() {
+  const elements = document.querySelectorAll("[data-reveal]");
+  if (!elements.length) return;
+
+  elements.forEach((element) => {
+    const delay = Number(element.dataset.revealDelay || 0);
+    if (!Number.isNaN(delay)) {
+      element.style.setProperty("--reveal-delay", `${delay}ms`);
+    }
+    if (!element.dataset.reveal) {
+      element.dataset.reveal = "hidden";
+    }
+  });
+
+  if (prefersReducedMotion) {
+    elements.forEach((element) => {
+      element.dataset.reveal = "visible";
+    });
+    return;
+  }
+
+  const observer = new IntersectionObserver(
+    (entries) => {
+      entries.forEach((entry) => {
+        if (entry.isIntersecting) {
+          entry.target.dataset.reveal = "visible";
+          observer.unobserve(entry.target);
+        }
+      });
+    },
+    { threshold: 0.2, rootMargin: "0px 0px -10% 0px" },
+  );
+
+  elements.forEach((element) => {
+    observer.observe(element);
+  });
+}
+
+function updateGlowPosition(element, event) {
+  const rect = element.getBoundingClientRect();
+  const x = ((event.clientX - rect.left) / rect.width) * 100;
+  const y = ((event.clientY - rect.top) / rect.height) * 100;
+  element.style.setProperty("--pointer-x", `${x}%`);
+  element.style.setProperty("--pointer-y", `${y}%`);
+  element.style.setProperty("--pointer-opacity", "1");
+}
+
+function resetGlow(element) {
+  element.style.setProperty("--pointer-opacity", "0");
+}
+
+export function initInteractiveGlow() {
+  const elements = document.querySelectorAll("[data-gradient]");
+  if (!elements.length) return;
+
+  elements.forEach((element) => {
+    element.addEventListener("pointermove", (event) => {
+      if (event.pointerType === "touch") return;
+      updateGlowPosition(element, event);
+    });
+
+    element.addEventListener("pointerenter", (event) => {
+      if (event.pointerType === "touch") {
+        const isActive = element.classList.toggle(GLOW_CLASS);
+        element.style.setProperty("--pointer-x", "50%");
+        element.style.setProperty("--pointer-y", "50%");
+        element.style.setProperty("--pointer-opacity", isActive ? "1" : "0");
+        return;
+      }
+      updateGlowPosition(element, event);
+      element.classList.add(GLOW_CLASS);
+    });
+
+    element.addEventListener("pointerleave", () => {
+      element.classList.remove(GLOW_CLASS);
+      resetGlow(element);
+    });
+
+    element.addEventListener("focus", () => {
+      element.classList.add(GLOW_CLASS);
+      element.style.setProperty("--pointer-x", "50%");
+      element.style.setProperty("--pointer-y", "50%");
+      element.style.setProperty("--pointer-opacity", "1");
+    });
+
+    element.addEventListener("blur", () => {
+      element.classList.remove(GLOW_CLASS);
+      resetGlow(element);
+    });
+  });
+}
+
+export function initTimelineProgress() {
+  const timeline = document.querySelector(".timeline");
+  if (!timeline) return;
+
+  const progressEl = timeline.querySelector(".timeline__progress");
+  const steps = Array.from(timeline.querySelectorAll("article"));
+  if (!steps.length || !progressEl) return;
+
+  const update = () => {
+    const rect = timeline.getBoundingClientRect();
+    const viewportHeight =
+      window.innerHeight || document.documentElement.clientHeight;
+    const scrollTop = window.scrollY || window.pageYOffset;
+    const start = rect.top + scrollTop;
+    const end = start + rect.height;
+    const centerScroll = scrollTop + viewportHeight * 0.5;
+    const progress = Math.min(
+      1,
+      Math.max(0, (centerScroll - start) / (end - start)),
+    );
+    progressEl.style.setProperty("--timeline-progress", progress.toString());
+
+    let closestStep = steps[0];
+    let minDistance = Number.POSITIVE_INFINITY;
+    const viewportCenter = viewportHeight * 0.5;
+
+    steps.forEach((step) => {
+      const bounds = step.getBoundingClientRect();
+      const stepCenter = bounds.top + bounds.height / 2;
+      const distance = Math.abs(stepCenter - viewportCenter);
+      if (distance < minDistance) {
+        minDistance = distance;
+        closestStep = step;
+      }
+    });
+
+    steps.forEach((step) => {
+      step.classList.toggle("is-active", step === closestStep);
+    });
+  };
+
+  update();
+  window.addEventListener("scroll", update, { passive: true });
+  window.addEventListener("resize", update);
+}
+
+export function initContactForm() {
+  const form = document.getElementById("contact-form");
+  if (!form) return;
+
+  const fields = form.querySelectorAll(".field");
+  fields.forEach((field) => {
+    const input = field.querySelector("input, textarea");
+    if (!input) return;
+    const toggleState = () => {
+      if (input.value.trim().length > 0) {
+        field.classList.add("is-filled");
+      } else {
+        field.classList.remove("is-filled");
+      }
+    };
+    input.addEventListener("focus", () => field.classList.add("is-focused"));
+    input.addEventListener("blur", () => field.classList.remove("is-focused"));
+    input.addEventListener("input", toggleState);
+    toggleState();
+  });
+
+  const messageField = form.querySelector('textarea[name="message"]');
+  const counter = form.querySelector("[data-char-counter]");
+  const statusEl = form.querySelector("[data-submit-status]");
+  const maxLength = messageField?.maxLength || 500;
+
+  if (messageField && counter) {
+    const updateCount = () => {
+      const remaining = Math.max(0, maxLength - messageField.value.length);
+      counter.textContent = remaining.toString();
+      if (remaining <= Math.round(maxLength * 0.2)) {
+        counter.parentElement?.setAttribute("data-state", "warn");
+      } else {
+        counter.parentElement?.removeAttribute("data-state");
+      }
+    };
+    messageField.addEventListener("input", updateCount);
+    updateCount();
+  }
+
+  if (statusEl) {
+    form.addEventListener("submit", () => {
+      statusEl.textContent = "Sending…";
+    });
+  }
+}
 
EOF
)
