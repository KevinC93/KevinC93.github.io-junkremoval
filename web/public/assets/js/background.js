export function initAuroraBackground() {
  const canvas = document.getElementById("aurora-canvas");
  if (!canvas) return;
  canvas.width = 0;
  canvas.height = 0;
  canvas.style.display = "none";
}