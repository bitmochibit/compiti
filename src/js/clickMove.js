import { state } from "./state.js";
import { moveTaskTo } from "./board.js";
import { columnFromPoint, getDropIndex, showPlaceholder, removePlaceholder } from "./dndUtils.js";
import { pickHint } from "./dom.js";
import { playPickup, playDrop } from "./audio.js";

let picked = null;

export function isClickToMove() {
  return !!state.settings.clickToMove;
}

function showHint(visible) {
  pickHint.classList.toggle("visible", visible);
}

export function clearPick() {
  if (picked) picked.el.classList.remove("picked");
  picked = null;
  showHint(false);
  removePlaceholder();
}

export function handleTaskClick(e, card, task, col) {
  if (e.target.closest("button")) return;
  e.stopPropagation();

  if (picked && picked.task.id === task.id) {
    clearPick();
    return;
  }

  if (picked) {
    const list = card.parentElement;
    const index = getDropIndex(list, e.clientY, picked.task.id);
    drop(col, index);
    return;
  }

  picked = { task, col, el: card };
  card.classList.add("picked");
  showHint(true);
  playPickup();
}

export function handleListClick(e, col, listEl) {
  if (!picked) return;
  if (e.target.closest(".task")) return;
  const index = getDropIndex(listEl, e.clientY, picked.task.id);
  drop(col, index);
}

function drop(toCol, index) {
  const { task, col: fromCol } = picked;
  clearPick();
  playDrop();
  moveTaskTo(task.id, fromCol.id, toCol.id, index);
}

document.addEventListener("keydown", e => {
  if (e.key === "Escape") clearPick();
});

document.addEventListener("pointermove", e => {
  if (!picked) return;
  const colEl = columnFromPoint(e.clientX, e.clientY);
  if (!colEl) {
    removePlaceholder();
    return;
  }
  const list = colEl.querySelector(".task-list");
  const index = getDropIndex(list, e.clientY, picked.task.id);
  showPlaceholder(list, index);
});
