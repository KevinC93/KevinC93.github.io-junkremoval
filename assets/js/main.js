import { initAuroraBackground } from "./background.js";
import { initLeprechauns } from "./leprechauns.js";
import {
  initContactForm,
  initInteractiveGlow,
  initMagneticElements,
  initMarquee,
  initMetricCounters,
  initParallax,
  initScrollReveal,
  initSmoothScroll,
  initTimelineProgress,
} from "./interactions.js";

document.documentElement.classList.remove("no-js");
document.documentElement.classList.add("js");

const yearEl = document.getElementById("year");
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

initAuroraBackground();
initLeprechauns();
initScrollReveal();
initInteractiveGlow();
initTimelineProgress();
initContactForm();
initMetricCounters();
initMagneticElements();
initSmoothScroll();
initParallax();
initMarquee();

window.__APP_LOADED__ = true;
