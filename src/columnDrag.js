import { state, saveState } from "./state.js";
import { board, dragLayer } from "./dom.js";
import { playPickup, playDrop, playHop } from "./audio.js";

const MOVE_THRESHOLD = 4;

export function startColumnDrag(e, col, wrap) {
  if (e.button !== undefined && e.button !== 0) return;
  e.preventDefault();
  e.stopPropagation();

  const startClientX = e.clientX;
  const startClientY = e.clientY;
  let dragging = false;

  const rect = wrap.getBoundingClientRect();
  const offsetX = e.clientX - rect.left;
  const offsetY = e.clientY - rect.top;

  const placeholder = document.createElement("div");
  placeholder.className = "column-placeholder";
  placeholder.style.width = rect.width + "px";
  placeholder.style.height = rect.height + "px";

  const useGsap = !!window.gsap;
  let xTo, yTo;
  let lastColEl = null;

  function beginDrag() {
    dragging = true;
    playPickup();

    board.insertBefore(placeholder, wrap);
    dragLayer.appendChild(wrap);

    wrap.classList.add("column-dragging");
    wrap.style.position = "fixed";
    wrap.style.left = "0px";
    wrap.style.top = "0px";
    wrap.style.width = rect.width + "px";
    wrap.style.pointerEvents = "none";

    if (useGsap) {
      gsap.set(wrap, { x: rect.left, y: rect.top, scale: 1 });
      gsap.to(wrap, { scale: 1.025, duration: 0.16, ease: "power2.out" });
      xTo = gsap.quickTo(wrap, "x", { duration: 0.16, ease: "power3" });
      yTo = gsap.quickTo(wrap, "y", { duration: 0.16, ease: "power3" });
    } else {
      wrap.style.left = rect.left + "px";
      wrap.style.top = rect.top + "px";
    }
  }

  function updatePosition(clientX, clientY) {
    const targetX = clientX - offsetX;
    const targetY = clientY - offsetY;
    if (useGsap) {
      xTo(targetX);
      yTo(targetY);
    } else {
      wrap.style.left = targetX + "px";
      wrap.style.top = targetY + "px";
    }
  }

  function repositionPlaceholder(clientX, clientY) {
    const cols = Array.from(board.querySelectorAll(".column"));
    let insertBefore = null;

    for (const el of cols) {
      const r = el.getBoundingClientRect();
      const mid = r.left + r.width / 2;
      if (clientX < mid) {
        insertBefore = el;
        break;
      }
    }

    const target = insertBefore || board.querySelector(".new-column");
    if (placeholder.nextSibling === target) return;

    if (target) {
      board.insertBefore(placeholder, target);
    } else {
      board.appendChild(placeholder);
    }

    const colEl = document.elementFromPoint(clientX, clientY);
    const hoveredCol = colEl && colEl.closest(".column");
    if (hoveredCol && hoveredCol !== lastColEl) {
      playHop();
      lastColEl = hoveredCol;
    }
  }

  function onMove(ev) {
    if (!dragging) {
      const dx = ev.clientX - startClientX;
      const dy = ev.clientY - startClientY;
      if (Math.hypot(dx, dy) < MOVE_THRESHOLD) return;
      beginDrag();
    }
    updatePosition(ev.clientX, ev.clientY);
    repositionPlaceholder(ev.clientX, ev.clientY);
  }

  function commitOrderFromDom() {
    const orderedIds = Array.from(board.querySelectorAll(".column")).map(el => el.dataset.colId);
    state.columns.sort((a, b) => orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id));
  }

  function endDrag() {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onUp);

    if (!dragging) return;

    if (useGsap) gsap.killTweensOf(wrap);

    wrap.classList.remove("column-dragging");
    wrap.style.position = "";
    wrap.style.left = "";
    wrap.style.top = "";
    wrap.style.width = "";
    wrap.style.pointerEvents = "";
    if (useGsap) gsap.set(wrap, { clearProps: "x,y,scale,rotation" });

    board.insertBefore(wrap, placeholder);
    placeholder.remove();

    commitOrderFromDom();
    saveState();
    playDrop();
  }

  function onUp() {
    endDrag();
  }

  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);
}
