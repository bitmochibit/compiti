import { moveTaskTo, render } from "./board.js";
import { dragLayer } from "./dom.js";
import { columnFromPoint, getDropIndex, showPlaceholder, removePlaceholder } from "./dndUtils.js";
import { playPickup, playDrop, playHop } from "./audio.js";

const MAX_TILT = 16;
const TILT_SENSITIVITY = 10;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function startDrag(e, card, task, col) {
  if (e.target.closest("button")) return;
  if (e.button !== undefined && e.button !== 0) return;
  e.preventDefault();

  playPickup();

  const rect = card.getBoundingClientRect();
  const offsetX = e.clientX - rect.left;
  const offsetY = e.clientY - rect.top;

  dragLayer.appendChild(card);

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
  let lastClientX = e.clientX;
  let lastClientY = e.clientY;
  let lastColEl = null;
  let ended = false;

  function updateTargetPosition(clientX, clientY) {
    const targetX = clientX - offsetX;
    const targetY = clientY - offsetY;

    if (useGsap) {
      xTo(targetX);
      yTo(targetY);
    } else {
      card.style.left = targetX + "px";
      card.style.top = targetY + "px";
    }

    document.querySelectorAll(".column").forEach(c => c.classList.remove("drag-over"));
    const colEl = columnFromPoint(clientX, clientY);

    if (colEl) {
      colEl.classList.add("drag-over");
      if (colEl !== lastColEl) {
        lastColEl = colEl;
      }
      const list = colEl.querySelector(".task-list");
      const index = getDropIndex(list, clientY, task.id);
      showPlaceholder(list, index);
    } else {
      lastColEl = null;
      removePlaceholder();
    }
  }

  function onMove(ev) {
    if (ended) return;

    lastClientX = ev.clientX;
    lastClientY = ev.clientY;

    const now = performance.now();
    const dt = Math.max(now - lastT, 1);
    const vx = (ev.clientX - lastX) / dt;
    lastX = ev.clientX;
    lastT = now;

    updateTargetPosition(ev.clientX, ev.clientY);

    if (useGsap) {
      rotTo(clamp(vx * TILT_SENSITIVITY, -MAX_TILT, MAX_TILT));
    }
  }

  function onPointerUp(ev) {
    endDrag(ev.clientX, ev.clientY);
  }

  function onForceEnd() {
    endDrag(lastClientX, lastClientY);
  }

  function onVisibilityChange() {
    if (document.hidden) onForceEnd();
  }

  function endDrag(clientX, clientY) {
    if (ended) return;
    ended = true;

    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerUp);
    window.removeEventListener("mouseup", onPointerUp);
    window.removeEventListener("blur", onForceEnd);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    document.removeEventListener("pointerleave", onForceEnd);

    document.querySelectorAll(".column").forEach(c => c.classList.remove("drag-over"));
    removePlaceholder();
    const colEl = columnFromPoint(clientX, clientY);

    const cleanup = () => {
      if (useGsap) gsap.killTweensOf(card);
      card.remove();
      playDrop();

      if (colEl) {
        const targetColId = colEl.dataset.colId;
        const list = colEl.querySelector(".task-list");
        const index = getDropIndex(list, clientY, task.id);
        moveTaskTo(task.id, col.id, targetColId, index);
      } else {
        render();
      }
    };

    cleanup();
  }

  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);
  window.addEventListener("mouseup", onPointerUp);
  window.addEventListener("blur", onForceEnd);
  document.addEventListener("visibilitychange", onVisibilityChange);
  document.addEventListener("pointerleave", onForceEnd);
}
