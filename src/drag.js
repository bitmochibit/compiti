import { moveTaskTo, render } from "./board.js";
import { dragLayer } from "./dom.js";

const MAX_TILT = 16;
const TILT_SENSITIVITY = 10;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function columnFromPoint(x, y) {
  const el = document.elementFromPoint(x, y);
  if (!el) return null;
  return el.closest(".column");
}

function getDropIndex(listEl, clientY, excludeId) {
  const items = Array.from(listEl.querySelectorAll(".task")).filter(el => el.dataset.taskId !== excludeId);
  for (let i = 0; i < items.length; i++) {
    const rect = items[i].getBoundingClientRect();
    const mid = rect.top + rect.height / 2;
    if (clientY < mid) return i;
  }
  return items.length;
}

export function startDrag(e, card, task, col) {
  if (e.target.closest("button")) return;
  if (e.button !== undefined && e.button !== 0) return;
  e.preventDefault();

  const rect = card.getBoundingClientRect();
  const offsetX = e.clientX - rect.left;
  const offsetY = e.clientY - rect.top;

  dragLayer.appendChild(card);
  card.setPointerCapture(e.pointerId);

  card.classList.add("dragging");
  card.style.position = "fixed";
  card.style.left = "0px";
  card.style.top = "0px";
  card.style.width = rect.width + "px";

  const useGsap = !!window.gsap;
  let xTo, yTo, rotTo;

  if (useGsap) {
    gsap.set(card, { x: rect.left, y: rect.top, rotation: 0, scale: 1 });
    gsap.to(card, { scale: 1.035, duration: 0.18, ease: "power2.out" });
    xTo = gsap.quickTo(card, "x", { duration: 0.32, ease: "power3" });
    yTo = gsap.quickTo(card, "y", { duration: 0.32, ease: "power3" });
    rotTo = gsap.quickTo(card, "rotation", { duration: 0.38, ease: "power2" });
  } else {
    card.style.left = rect.left + "px";
    card.style.top = rect.top + "px";
  }

  let lastX = e.clientX;
  let lastT = performance.now();

  function onMove(ev) {
    const now = performance.now();
    const dt = Math.max(now - lastT, 1);
    const vx = (ev.clientX - lastX) / dt;
    lastX = ev.clientX;
    lastT = now;

    const targetX = ev.clientX - offsetX;
    const targetY = ev.clientY - offsetY;

    if (useGsap) {
      xTo(targetX);
      yTo(targetY);
      rotTo(clamp(vx * TILT_SENSITIVITY, -MAX_TILT, MAX_TILT));
    } else {
      card.style.left = targetX + "px";
      card.style.top = targetY + "px";
    }

    document.querySelectorAll(".column").forEach(c => c.classList.remove("drag-over"));
    const colEl = columnFromPoint(ev.clientX, ev.clientY);
    if (colEl) colEl.classList.add("drag-over");
  }

  function finishDrag(ev) {
    document.querySelectorAll(".column").forEach(c => c.classList.remove("drag-over"));
    const colEl = columnFromPoint(ev.clientX, ev.clientY);

    const cleanup = () => {
      card.remove();

      if (colEl) {
        const targetColId = colEl.dataset.colId;
        const list = colEl.querySelector(".task-list");
        const index = getDropIndex(list, ev.clientY, task.id);
        moveTaskTo(task.id, col.id, targetColId, index);
      } else {
        render();
      }
    };

    if (useGsap) {
      gsap.to(card, {
        rotation: 0,
        scale: 1,
        duration: 0.22,
        ease: "power2.out",
        onComplete: cleanup
      });
    } else {
      cleanup();
    }
  }

  function onUp(ev) {
    card.removeEventListener("pointermove", onMove);
    card.removeEventListener("pointerup", onUp);
    card.removeEventListener("pointercancel", onUp);
    finishDrag(ev);
  }

  card.addEventListener("pointermove", onMove);
  card.addEventListener("pointerup", onUp);
  card.addEventListener("pointercancel", onUp);
}
