import {
  editOverlay,
  editTitleInput,
  editDescInput,
  editDescRow,
  editLabelsRow,
  editLabelsInput,
  editDoneRow,
  editDoneInput,
  editSaveBtn,
  editCancelBtn
} from "./dom.js";

let saveCallback = null;

export function openEditor(options) {
  editTitleInput.value = options.title || "";
  editDescInput.value = options.desc || "";
  editDescRow.style.display = options.showDesc ? "flex" : "none";

  editLabelsRow.style.display = options.showLabels ? "flex" : "none";
  editLabelsInput.value = (options.labels || []).join(", ");

  editDoneRow.style.display = options.showDone ? "flex" : "none";
  editDoneInput.checked = !!options.done;

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
  if (saveCallback) {
    const labels = editLabelsInput.value
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);
    saveCallback(editTitleInput.value.trim(), editDescInput.value.trim(), labels, editDoneInput.checked);
  }
  closeEditor();
});
