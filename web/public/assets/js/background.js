const canvas = document.getElementById("aurora-canvas");
const moneyRainLayer = document.getElementById("money-rain");

let activeTimers = new Set();

function clearTimers() {
  activeTimers.forEach((id) => window.clearTimeout(id));
  activeTimers.clear();
}

export function initAuroraBackground() {
  if (!canvas) return;
  canvas.width = 0;
  canvas.height = 0;
  canvas.style.display = "none";
}

function createBillElement() {
  const bill = document.createElement("div");
  bill.className = "bill";
  const wrap = document.createElement("span");
  wrap.className = "bill__value";
  wrap.textContent = "$100";
  const serial = document.createElement("span");
  serial.className = "bill__serial";
  serial.textContent = `A${Math.floor(Math.random() * 900000 + 100000)}`;
  const seal = document.createElement("span");
  seal.className = "bill__seal";
  seal.textContent = "USD";
  bill.append(serial, wrap, seal);
  return bill;
}

export function triggerMoneyRain(duration = 6000) {
  if (!moneyRainLayer) return;
  clearTimers();
  moneyRainLayer.classList.add("is-active");
  const bills = new Set();
  const start = performance.now();

  const spawn = () => {
    const now = performance.now();
    if (now - start > duration) return;
    const bill = createBillElement();
    bill.style.left = `${Math.random() * 100}%`;
    bill.style.setProperty("--drift", `${(Math.random() - 0.5) * 160}px`);
    bill.style.setProperty("--duration", `${4200 + Math.random() * 2200}ms`);
    bill.style.setProperty("--rotation", `${(Math.random() - 0.5) * 10}deg`);
    bill.style.animationDelay = `${Math.random() * 160}ms`;
    moneyRainLayer.appendChild(bill);
    bills.add(bill);
    bill.addEventListener("animationend", () => {
      bills.delete(bill);
      bill.remove();
    });
    const delay = 140 + Math.random() * 220;
    const id = window.setTimeout(spawn, delay);
    activeTimers.add(id);
  };

  spawn();

  const cleanup = window.setTimeout(() => {
    bills.forEach((bill) => bill.remove());
    moneyRainLayer.classList.remove("is-active");
    clearTimers();
  }, duration + 4600);
  activeTimers.add(cleanup);
}

window.addEventListener("beforeunload", () => {
  clearTimers();
});