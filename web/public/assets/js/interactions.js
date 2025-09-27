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
    const activate = () => {
      element.classList.add(GLOW_CLASS);
      element.style.setProperty("--pointer-opacity", "1");
    };

    const handlePointerUpdate = (event) => {
      if (event.pointerType === "touch") return;
      activate();
      updateGlowPosition(element, event);
    };

    const handlePointerLeave = () => {
      element.classList.remove(GLOW_CLASS);
      resetGlow(element);
    };

    element.addEventListener("pointerenter", handlePointerUpdate);
    element.addEventListener("pointermove", handlePointerUpdate);
    element.addEventListener("pointerdown", handlePointerUpdate);
    element.addEventListener("pointerleave", handlePointerLeave);

    element.addEventListener("focus", () => {
      element.classList.add(GLOW_CLASS);
      element.style.setProperty("--pointer-x", "50%");
      element.style.setProperty("--pointer-y", "50%");
      element.style.setProperty("--pointer-opacity", "1");
    });

    element.addEventListener("blur", () => {
      handlePointerLeave();
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
      statusEl.textContent = "Transmitting...";
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

export function initCursorPops() {
  const pops = document.getElementById("pops");
  if (!pops) return;

  const isCoarse = window.matchMedia("(pointer:coarse)").matches;
  const words = ["CPC", "CAC", "ROAS", "A/B", "CRM", "SEM"];
  const minDelay = isCoarse ? 260 : 120;
  let index = 0;
  let last = 0;

  window.addEventListener(
    "pointermove",
    (event) => {
      if (event.pointerType === "touch") return;
      const now = performance.now();
      if (now - last < minDelay) return;
      last = now;

      const word = words[index % words.length];
      index += 1;

      const pop = document.createElement("div");
      pop.className = "pop";
      if (word === "ROAS") {
        pop.classList.add("gold");
      }
      pop.textContent = word;
      pop.style.left = `${event.clientX}px`;
      pop.style.top = `${event.clientY}px`;
      pops.appendChild(pop);

      window.setTimeout(() => {
        pop.remove();
      }, 1700);
    },
    { passive: true },
  );
}

export function initServiceHover() {
  const items = document.querySelectorAll("#services .svc");
  if (!items.length) return;

  items.forEach((item) => {
    item.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch") return;
      const rect = item.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      item.style.setProperty("--mx", `${x}px`);
      item.style.setProperty("--my", `${y}px`);
    });

    item.addEventListener("pointerleave", () => {
      item.style.removeProperty("--mx");
      item.style.removeProperty("--my");
    });
  });
}

export function initRevealCards() {
  const cards = document.querySelectorAll("#brand .revealcard");
  if (!cards.length) return;
  const isCoarse = window.matchMedia("(pointer:coarse)").matches;
  if (!isCoarse) return;

  cards.forEach((card) => {
    const toggle = (event) => {
      if (event.target.closest("button, a")) return;
      event.preventDefault();
      card.classList.toggle("open");
    };
    card.addEventListener("click", toggle);
    card.addEventListener("touchstart", toggle, { passive: false });
  });
}

export function initFounderOffer() {
  const spotsEl = document.getElementById("spots");
  const claim = document.getElementById("claim");
  if (!spotsEl || !claim || claim.dataset.boundCalendly === "1") return;

  const storageKey = "founder_spots_left_v1";
  let spots = parseInt(localStorage.getItem(storageKey) || "5", 10);
  if (Number.isNaN(spots) || spots < 1 || spots > 5) {
    spots = 5;
  }

  const render = () => {
    spotsEl.textContent = `( ${spots} of 5 left )`;
  };

  render();

  const openCalendly = () => {
    const url = "https://calendly.com/kevincacheiro93/30-min-meeting";
    if (window.Calendly && typeof window.Calendly.initPopupWidget === "function") {
      window.Calendly.initPopupWidget({ url });
    } else {
      window.open(url, "_blank", "noopener");
    }
  };

  claim.addEventListener(
    "click",
    (event) => {
      event.preventDefault();
      openCalendly();
      if (spots > 1) {
        spots -= 1;
        localStorage.setItem(storageKey, String(spots));
        render();
      }
    },
    { passive: false },
  );

  claim.dataset.boundCalendly = "1";
}

export function initContactModal() {
  const modal = document.getElementById("contact-modal");
  if (!modal) return;
  const openTriggers = document.querySelectorAll('[data-open="contact-modal"]');
  if (!openTriggers.length) return;

  const body = document.body;

  const openModal = () => {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    body.style.overflow = "hidden";
  };

  const closeModal = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    body.style.overflow = "";
  };

  openTriggers.forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      openModal();
    });
  });

  modal.addEventListener("click", (event) => {
    const target = event.target;
    if (target instanceof Element && target.dataset.close === "contact-modal") {
      event.preventDefault();
      closeModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("is-open")) {
      closeModal();
    }
  });

  window.addEventListener("beforeunload", () => {
    modal.classList.remove("is-open");
  });
}

export function initCursorTrail() {
  const canvas = document.getElementById("trail");
  if (!(canvas instanceof HTMLCanvasElement)) return;
  if (window.matchMedia("(pointer:coarse)").matches) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.style.pointerEvents = "none";
  canvas.style.mixBlendMode = "screen";

  const KEYWORDS = [
    { text: "CPC", color: "47, 128, 237" },
    { text: "SEM", color: "14, 165, 233" },
    { text: "CAC", color: "14, 165, 129" },
    { text: "CRM", color: "79, 70, 229" },
    { text: "ROAS", color: "217, 119, 6" },
  ];

  const glyphs = [];
  let keywordIndex = 0;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let rafId = 0;
  let lastTime = 0;

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const addGlyph = (x, y, boost = 0) => {
    const keyword = KEYWORDS[keywordIndex];
    keywordIndex = (keywordIndex + 1) % KEYWORDS.length;
    glyphs.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 0.45,
      vy: -0.25 - Math.random() * 0.2,
      life: 1,
      text: keyword.text,
      color: keyword.color,
      wobble: Math.random() * Math.PI * 2,
      boost,
    });
    if (glyphs.length > 72) {
      glyphs.shift();
    }
    if (!rafId) {
      lastTime = performance.now();
      rafId = window.requestAnimationFrame(render);
    }
  };

  const render = (timestamp) => {
    const delta = Math.min(timestamp - lastTime, 48) || 16;
    lastTime = timestamp;
    ctx.clearRect(0, 0, width, height);

    for (let i = glyphs.length - 1; i >= 0; i -= 1) {
      const glyph = glyphs[i];
      glyph.life -= 0.016 * (delta / 16);
      if (glyph.life <= 0) {
        glyphs.splice(i, 1);
        continue;
      }
      glyph.x += glyph.vx * delta * 0.05;
      glyph.y += glyph.vy * delta * 0.05;
      glyph.wobble += 0.14;
      const alphaBase = glyph.life + glyph.boost * 0.25;
      const alpha = Math.max(Math.min(alphaBase, 1), 0);
      const fontSize = 18 + (1 - glyph.life) * 16 + glyph.boost * 6;
      ctx.font = "600 " + fontSize.toFixed(1) + 'px "Space Grotesk", "Manrope", sans-serif';
      ctx.fillStyle = "rgba(" + glyph.color + ", " + alpha.toFixed(3) + ")";
      ctx.shadowColor = "rgba(14, 165, 233, " + (alpha * 0.35).toFixed(3) + ")";
      ctx.shadowBlur = 14;
      const offsetX = Math.sin(glyph.wobble) * 8;
      const offsetY = Math.cos(glyph.wobble) * 6;
      ctx.fillText(glyph.text, glyph.x + offsetX, glyph.y + offsetY);
      ctx.shadowBlur = 0;

      if (glyph.text === "ROAS") {
        ctx.strokeStyle = "rgba(217, 119, 6, " + (alpha * 0.85).toFixed(3) + ")";
        ctx.lineWidth = 1.4;
        ctx.strokeText(glyph.text, glyph.x + offsetX, glyph.y + offsetY);
      }
    }

    if (glyphs.length) {
      rafId = window.requestAnimationFrame(render);
    } else {
      rafId = 0;
      ctx.clearRect(0, 0, width, height);
    }
  };

  const handlePointerMove = (event) => {
    if (event.pointerType && event.pointerType !== "mouse" && event.pointerType !== "pen") {
      return;
    }
    addGlyph(event.clientX, event.clientY);
  };

  const handlePointerDown = (event) => {
    addGlyph(event.clientX, event.clientY, 0.6);
  };

  resize();
  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", handlePointerMove, { passive: true });
  window.addEventListener("pointerdown", handlePointerDown, { passive: true });

  window.addEventListener("beforeunload", () => {
    if (rafId) {
      window.cancelAnimationFrame(rafId);
    }
  });
}

export function initTiltTargets() {
  if (prefersReducedMotion) return;
  if (window.matchMedia("(pointer: coarse)").matches) return;

  const selectors = [
    ".panel__card",
    ".revealcard",
    ".svc",
    ".timeline article",
    ".media-orbit",
    ".faq-list li",
    ".proof-card",
    ".hero__cluster",
    ".value__card",
    ".metric"
  ];

  const nodes = document.querySelectorAll(selectors.join(", "));
  if (!nodes.length) return;

  nodes.forEach((node) => {
    if (node.dataset.tiltReady === "true") return;
    node.dataset.tiltReady = "true";
    node.setAttribute("data-tilt", "");

    const handleMove = (event) => {
      if (event.pointerType === "touch") return;
      const rect = node.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const ratioX = Math.min(Math.max(x / rect.width, 0), 1);
      const ratioY = Math.min(Math.max(y / rect.height, 0), 1);
      const tiltX = (0.5 - ratioY) * 12;
      const tiltY = (ratioX - 0.5) * 14;

      node.style.setProperty("--tiltX", tiltX.toFixed(2) + "deg");
      node.style.setProperty("--tiltY", tiltY.toFixed(2) + "deg");
      node.style.setProperty("--tilt-pointer-x", (ratioX * 100).toFixed(2) + "%");
      node.style.setProperty("--tilt-pointer-y", (ratioY * 100).toFixed(2) + "%");
      node.classList.add("tilt-active");
    };

    const resetTilt = () => {
      node.style.setProperty("--tiltX", "0deg");
      node.style.setProperty("--tiltY", "0deg");
      node.classList.remove("tilt-active");
    };

    node.addEventListener("pointermove", handleMove);
    node.addEventListener("pointerleave", resetTilt);
    node.addEventListener("pointerup", () => {
      window.setTimeout(resetTilt, 120);
    });
    node.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "touch") return;
      node.classList.add("tilt-active");
    });
  });
}

export function initInfinityLoop() {
  const loop = document.getElementById("cursor-loop");
  if (!loop) return;

  if (prefersReducedMotion) {
    loop.style.setProperty("--loop-angle", "0deg");
    loop.style.setProperty("--loop-progress", "0");
    return;
  }

  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  let rafId = 0;
  let targetAngle = 0;
  let currentAngle = 0;
  let autoSpinVelocity = coarsePointer ? 0.9 : 0;

  const recalcCenter = () => {
    const bounds = loop.getBoundingClientRect();
    centerX = bounds.left + bounds.width / 2;
    centerY = bounds.top + bounds.height / 2;
  };

  let centerX = window.innerWidth / 2;
  let centerY = loop.getBoundingClientRect().top + loop.offsetHeight / 2;

  const update = () => {
    if (autoSpinVelocity) {
      targetAngle += autoSpinVelocity;
    }
    const delta = ((targetAngle - currentAngle + 540) % 360) - 180;
    currentAngle += delta * 0.12;
    const normalized = (currentAngle % 360 + 360) % 360;
    loop.style.setProperty("--loop-angle", normalized.toFixed(3) + "deg");
    loop.style.setProperty("--loop-progress", (normalized / 360).toFixed(4));
    rafId = window.requestAnimationFrame(update);
  };

  const handlePointer = (event) => {
    if (event.pointerType && event.pointerType !== "mouse" && event.pointerType !== "pen") {
      return;
    }
    autoSpinVelocity = 0;
    const angle = Math.atan2(event.clientY - centerY, event.clientX - centerX);
    targetAngle = angle * (180 / Math.PI);
  };

  recalcCenter();
  loop.dataset.ready = "true";
  rafId = window.requestAnimationFrame(update);
  window.addEventListener("pointermove", handlePointer, { passive: true });
  window.addEventListener("pointerdown", handlePointer, { passive: true });
  window.addEventListener("resize", () => {
    recalcCenter();
  });
  window.addEventListener("beforeunload", () => {
    if (rafId) {
      window.cancelAnimationFrame(rafId);
    }
  });
}
export function initMediaOrbits() {
  const nodes = document.querySelectorAll(
    '[data-immersive-content] img, [data-immersive-content] video, [data-immersive-content] svg',
  );
  if (!nodes.length) return;

  nodes.forEach((node) => {
    const parent = node.parentElement;
    if (!parent) return;
    if (node.closest('.media-orbit')) return;
    const wrapper = document.createElement('span');
    wrapper.className = 'media-orbit';
    const halo = document.createElement('span');
    halo.className = 'media-orbit__halo';

    parent.insertBefore(wrapper, node);
    wrapper.appendChild(node);
    wrapper.appendChild(halo);

    if (node instanceof HTMLImageElement) {
      if (!node.hasAttribute('loading')) {
        node.loading = 'lazy';
      }
      if (!node.hasAttribute('decoding')) {
        node.decoding = 'async';
      }
    }
  });
}



