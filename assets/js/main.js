import { initHeartCanvas } from "./background.js";
import { initLeprechauns } from "./leprechauns.js";
import {
  initContactForm,
  initInteractiveGlow,
  initScrollReveal,
  initTimelineProgress,
} from "./interactions.js";

document.documentElement.classList.add("js");

const state = {
  spotsRemaining: 5,
};

const yearEl = document.getElementById("year");
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

function initFomoWidget() {
  const claimButton = document.getElementById("claim");
  const spotsEl = document.getElementById("spots-remaining");
  if (!claimButton || !spotsEl) return;

  try {
    const saved = window.localStorage.getItem("kc-spots-remaining");
    if (saved) {
      state.spotsRemaining = Math.max(0, Number(saved));
      spotsEl.textContent = state.spotsRemaining.toString();
    }
  } catch (error) {
    console.warn("localStorage unavailable", error);
  }

  claimButton.addEventListener("click", () => {
