const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;
const GLOW_CLASS = "glow-active";

export function initScrollReveal() {
  const elements = Array.from(document.querySelectorAll("[data-reveal]"));
  if (!elements.length) return;

  elements.forEach((element) => {
    const delay = Number(element.dataset.revealDelay || 0);
    if (!Number.isNaN(delay)) {
      element.style.setProperty("--reveal-delay", `${delay}ms`);
    }
    if (!element.dataset.reveal) {
      element.dataset.reveal = "hidden";
    }
  });

  const hiddenElements = new Set(
    elements.filter((element) => element.dataset.reveal !== "visible"),
  );

  if (prefersReducedMotion) {
    hiddenElements.forEach((element) => {
      element.dataset.reveal = "visible";
    });
    hiddenElements.clear();
    return;
  }

  function revealElement(element) {
    if (!hiddenElements.has(element)) return;
    element.dataset.reveal = "visible";
    hiddenElements.delete(element);
  }

  function manualCheck() {
    if (!hiddenElements.size) return;
    const viewportHeight =
      window.innerHeight || document.documentElement.clientHeight || 0;
    hiddenElements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.top <= viewportHeight * 0.9 && rect.bottom >= 0) {
        revealElement(element);
      }
    });
  }

  let observer;
  if ("IntersectionObserver" in window) {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            revealElement(entry.target);
            observer?.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -10% 0px" },
    );

    hiddenElements.forEach((element) => observer?.observe(element));
  }

  manualCheck();

  if (hiddenElements.size) {
    window.addEventListener("scroll", manualCheck, { passive: true });
    window.addEventListener("resize", manualCheck);
  }
}

function updateGlowPosition(element, event) {
  const rect = element.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;
  element.style.setProperty("--pointer-x", `${x}%`);
  element.style.setProperty("--pointer-y", `${y}%`);
  element.style.setProperty("--pointer-opacity", "1");
}

function resetGlow(element) {
  element.style.setProperty("--pointer-opacity", "0");
}

export function initInteractiveGlow() {
  const elements = document.querySelectorAll("[data-gradient]");
  if (!elements.length) return;

  elements.forEach((element) => {
    element.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch") return;
      updateGlowPosition(element, event);
    });

@@ -88,102 +119,259 @@ export function initInteractiveGlow() {
      element.style.setProperty("--pointer-opacity", "1");
    });

    element.addEventListener("blur", () => {
      element.classList.remove(GLOW_CLASS);
      resetGlow(element);
    });
  });
}

export function initTimelineProgress() {
  const timeline = document.querySelector(".timeline");
  if (!timeline) return;

  const progressEl = timeline.querySelector(".timeline__progress");
  const steps = Array.from(timeline.querySelectorAll("article"));
  if (!steps.length || !progressEl) return;

  const update = () => {
    const rect = timeline.getBoundingClientRect();
    const viewportHeight =
      window.innerHeight || document.documentElement.clientHeight;
    const scrollTop = window.scrollY || window.pageYOffset;
    const start = rect.top + scrollTop;
    const end = start + rect.height;
    const centerScroll = scrollTop + viewportHeight * 0.45;
    const progress = Math.min(
      1,
      Math.max(0, (centerScroll - start) / (end - start)),
    );
    progressEl.style.setProperty("--timeline-progress", progress.toString());

    let closestStep = steps[0];
    let minDistance = Number.POSITIVE_INFINITY;
    const viewportCenter = viewportHeight * 0.45;

    steps.forEach((step) => {
      const bounds = step.getBoundingClientRect();
      const stepCenter = bounds.top + bounds.height / 2;
      const distance = Math.abs(stepCenter - viewportCenter);
      if (distance < minDistance) {
        minDistance = distance;
        closestStep = step;
      }
    });

    steps.forEach((step) => {
      step.classList.toggle("is-active", step === closestStep);
    });
  };

  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
}

export function initContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;

  const fields = form.querySelectorAll(".field");
  fields.forEach((field) => {
    const input = field.querySelector("input, textarea");
    if (!input) return;
    const toggleState = () => {
      if (input.value.trim().length > 0) {
        field.classList.add("is-filled");
      } else {
        field.classList.remove("is-filled");
      }
    };
    input.addEventListener("focus", () => field.classList.add("is-focused"));
    input.addEventListener("blur", () => field.classList.remove("is-focused"));
    input.addEventListener("input", toggleState);
    toggleState();
  });

  const messageField = form.querySelector('textarea[name="message"]');
  const counter = form.querySelector("[data-char-counter]");
  const maxLength = messageField?.maxLength || 600;

  if (messageField && counter) {
    const updateCount = () => {
      const remaining = Math.max(0, maxLength - messageField.value.length);
      counter.textContent = remaining.toString();
      if (remaining <= Math.round(maxLength * 0.2)) {
        counter.parentElement?.setAttribute("data-state", "warn");
      } else {
        counter.parentElement?.removeAttribute("data-state");
      }
    };
    messageField.addEventListener("input", updateCount);
    updateCount();
  }

  const statusEl = form.querySelector("[data-submit-status]");
  if (statusEl) {
    form.addEventListener("submit", () => {
      statusEl.textContent = "Transmitting…";
    });
  }
}

export function initMetricCounters() {
  const counters = Array.from(document.querySelectorAll("[data-count-to]"));
  if (!counters.length) return;

  const animateCounter = (element) => {
    const target = Number(element.dataset.countTo);
    if (!Number.isFinite(target)) return;
    const duration = Number(element.dataset.countDuration || 1600);
    const prefix = element.dataset.countPrefix || "";
    const suffix = element.dataset.countSuffix || "";
    const decimals = Number(element.dataset.countDecimals || 0);
    const startValue = Number(element.textContent?.replace(/[^0-9.-]/g, "")) || 0;
    const start = performance.now();

    const step = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = startValue + (target - startValue) * eased;
      element.textContent = `${prefix}${value.toFixed(decimals)}${suffix}`;
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  };

  const seen = new WeakSet();

  const reveal = (element) => {
    if (seen.has(element)) return;
    seen.add(element);
    animateCounter(element);
  };

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    counters.forEach(reveal);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          reveal(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 },
  );

  counters.forEach((element) => observer.observe(element));
}

export function initMagneticElements() {
  const elements = document.querySelectorAll("[data-magnetic]");
  if (!elements.length || prefersReducedMotion) return;

  elements.forEach((element) => {
    const strength = 18;
    let rafId;

    const reset = () => {
      element.style.removeProperty("transform");
    };

    const handlePointerMove = (event) => {
      const rect = element.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * strength;
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * strength;
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        element.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`;
      });
    };

    element.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch") return;
      handlePointerMove(event);
    });

    element.addEventListener("pointerleave", () => {
      cancelAnimationFrame(rafId);
      reset();
    });

    element.addEventListener("blur", reset);
    element.addEventListener("focus", reset);
  });
}

export function initSmoothScroll() {
  const triggers = document.querySelectorAll("[data-scroll-to]");
  if (!triggers.length) return;

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      const targetSelector = trigger.getAttribute("data-scroll-to");
      if (!targetSelector) return;
      const target = document.querySelector(targetSelector);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
    });
  });
}

export function initParallax() {
  if (prefersReducedMotion) return;
  const root = document.querySelector("[data-parallax]");
  if (!root) return;
  const layers = Array.from(root.querySelectorAll("[data-parallax-layer]"));
  if (!layers.length) return;

  const handlePointerMove = (event) => {
    const rect = root.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;

    layers.forEach((layer) => {
      const depth = Number(layer.dataset.depth || 0.2);
      layer.style.transform = `translate3d(${(-x * depth * 16).toFixed(2)}px, ${(-y * depth * 16).toFixed(2)}px, 0)`;
    });
  };

  const reset = () => {
    layers.forEach((layer) => {
      layer.style.transform = "translate3d(0, 0, 0)";
    });
  };

  root.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch") return;
    handlePointerMove(event);
  });

  root.addEventListener("pointerleave", reset);
}

export function initMarquee() {
  const marquee = document.querySelector("[data-marquee]");
  if (!marquee) return;
  const track = marquee.querySelector(".marquee__track");
  if (!track || track.dataset.duplicated) return;
  track.dataset.duplicated = "true";

  const clone = track.cloneNode(true);
  clone.setAttribute("aria-hidden", "true");

  const computed = window.getComputedStyle(track);
  const duration = parseFloat(computed.animationDuration) || 24;
  clone.style.animationDelay = `-${duration / 2}s`;

  track.parentElement?.appendChild(clone);
}
