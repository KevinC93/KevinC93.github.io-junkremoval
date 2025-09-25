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

  let fallbackActive = false;

  function stopManualFallback() {
    if (!fallbackActive) return;
    fallbackActive = false;
    window.removeEventListener("scroll", handleManualCheck);
    window.removeEventListener("resize", handleManualCheck);
  }

  function revealElement(element) {
    if (!hiddenElements.has(element)) return;
    element.dataset.reveal = "visible";
    hiddenElements.delete(element);
    if (!hiddenElements.size) {
      stopManualFallback();
    }
  }

  function checkInView() {
    if (!hiddenElements.size) return;
    const viewportHeight =
      window.innerHeight || document.documentElement.clientHeight || 0;
    for (const element of Array.from(hiddenElements)) {
      const rect = element.getBoundingClientRect();
      const isInView = rect.top <= viewportHeight && rect.bottom >= 0;
      if (isInView) {
        revealElement(element);
      }
    }
  }

  function handleManualCheck() {
    if (!hiddenElements.size) {
      stopManualFallback();
      return;
    }
    window.requestAnimationFrame(checkInView);
  }

  function startManualFallback() {
    if (fallbackActive) return;
    fallbackActive = true;
    window.addEventListener("scroll", handleManualCheck, { passive: true });
    window.addEventListener("resize", handleManualCheck);
    checkInView();
  }

  let observer;
  if ("IntersectionObserver" in window) {
    try {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              revealElement(entry.target);
              observer?.unobserve(entry.target);
            }
          });
          if (!hiddenElements.size) {
            observer?.disconnect();
          }
        },
        { threshold: 0.2, rootMargin: "0px 0px -10% 0px" },
      );
    } catch (error) {
      console.warn(
        "IntersectionObserver failed to initialise. Falling back to scroll checks.",
        error,
      );
      observer = undefined;
    }
  }

  if (observer) {
    hiddenElements.forEach((element) => {
      observer.observe(element);
    });
  }

  checkInView();

  if (hiddenElements.size) {
    startManualFallback();
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
