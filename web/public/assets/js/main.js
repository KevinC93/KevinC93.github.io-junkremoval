import { initAuroraBackground } from "./background.js";
import { initLeprechauns } from "./leprechauns.js";
import {
  initContactForm,
  initContactModal,
  initCursorPops,
  initCursorTrail,
  initInteractiveGlow,
  initMagneticElements,
  initMarquee,
  initMetricCounters,
  initParallax,
  initRevealCards,
  initScrollReveal,
  initSmoothScroll,
  initServiceHover,
  initTimelineProgress,
  initFounderOffer,
  initMediaOrbits,
  initTiltTargets,
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
initCursorTrail();
initCursorPops();
initServiceHover();
initRevealCards();
initFounderOffer();
initMediaOrbits();
initTiltTargets();
window.setTimeout(initTiltTargets, 400);
initContactModal();

window.__APP_LOADED__ = true;


