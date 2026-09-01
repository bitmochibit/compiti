import { clockEl } from "./dom.js";

function tick() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  clockEl.textContent = hh + ":" + mm;
}

export function startClock() {
  tick();
  setInterval(tick, 1000 * 15);
}
