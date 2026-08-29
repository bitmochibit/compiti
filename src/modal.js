import {
  editOverlay,
  editTitleInput,
  editDescInput,
  editDescRow,
  editSaveBtn,
  editCancelBtn
} from "./dom.js";

let saveCallback = null;

export function openEditor(options) {
  editTitleInput.value = options.title || "";
  editDescInput.value = options.desc || "";
  editDescRow.style.display = options.showDesc ? "flex" : "none";
  saveCallback = options.onSave;
  editOverlay.classList.add("open");
  requestAnimationFrame(() => editTitleInput.focus());
}

export function closeEditor() {
  editOverlay.classList.remove("open");
  saveCallback = null;
}

editCancelBtn.addEventListener("click", closeEditor);

editOverlay.addEventListener("click", e => {
  if (e.target === editOverlay) closeEditor();
});

editSaveBtn.addEventListener("click", () => {
  if (saveCallback) saveCallback(editTitleInput.value.trim(), editDescInput.value.trim());
  closeEditor();
});
