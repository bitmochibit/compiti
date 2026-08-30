export function columnFromPoint(x, y) {
  const el = document.elementFromPoint(x, y);
  if (!el) return null;
  return el.closest(".column");
}

export function getDropIndex(listEl, clientY, excludeId) {
  const items = Array.from(listEl.querySelectorAll(".task")).filter(el => el.dataset.taskId !== excludeId);
  for (let i = 0; i < items.length; i++) {
    const rect = items[i].getBoundingClientRect();
    const mid = rect.top + rect.height / 2;
    if (clientY < mid) return i;
  }
  return items.length;
}

let placeholderEl = null;

function ensurePlaceholder() {
  if (!placeholderEl) {
    placeholderEl = document.createElement("div");
    placeholderEl.className = "drop-indicator";
  }
  return placeholderEl;
}

export function showPlaceholder(listEl, index) {
  if (!listEl) return;
  const el = ensurePlaceholder();
  const items = Array.from(listEl.querySelectorAll(".task"));
  const ref = items[index] || null;
  if (el.parentElement !== listEl || el.nextSibling !== ref) {
    listEl.insertBefore(el, ref);
  }
}

export function removePlaceholder() {
  if (placeholderEl && placeholderEl.parentElement) {
    placeholderEl.parentElement.removeChild(placeholderEl);
  }
}
