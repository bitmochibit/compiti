import { state, saveState, ACCENTS, newColumnId, newTaskObj, colorForLabel, parseColor, toHex } from "./state.js";
import { board, totalEl } from "./dom.js";
import { openEditor } from "./modal.js";
import { startDrag } from "./drag.js";
import { startColumnDrag } from "./columnDrag.js";
import { isClickToMove, handleTaskClick, handleListClick, clearPick } from "./clickMove.js";

if (window.gsap && window.Flip) {
  gsap.registerPlugin(Flip);
}

function captureFlipState() {
  if (!window.Flip) return null;
  return Flip.getState("[data-flip-id]");
}

function playFlip(flipState) {
  if (!flipState || !window.Flip) return;
  Flip.from(flipState, {
    duration: 0.45,
    ease: "power2.out",
    absolute: true,
    stagger: 0.02,
    nested: true
  });
}

function countTasks() {
  return state.columns.reduce((n, c) => n + c.tasks.length, 0);
}

export function render() {
  clearPick();
  board.innerHTML = "";
  state.columns.forEach(col => board.appendChild(renderColumn(col)));
  board.appendChild(renderAddColumnButton());

  const n = countTasks();
  totalEl.textContent = n + (n === 1 ? " task" : " task");
}

function renderAddColumnButton() {
  const addCol = document.createElement("div");
  addCol.className = "new-column";
  addCol.textContent = "+ NEW COLUMN";
  addCol.addEventListener("click", () => {
    const flipState = captureFlipState();
    const col = {
      id: newColumnId(),
      title: "New column",
      accent: ACCENTS[state.columns.length % ACCENTS.length],
      done: false,
      tasks: []
    };
    state.columns.push(col);
    saveState();
    render();
    playFlip(flipState);
    openEditor({
      title: col.title,
      showDesc: false,
      showDone: true,
      done: col.done,
      onSave: (newTitle, _desc, _labels, done) => {
        col.title = newTitle || "Untitled";
        applyColumnDone(col, done);
        saveState();
        render();
      }
    });
  });
  return addCol;
}

function applyColumnDone(col, done) {
  const changed = col.done !== !!done;
  col.done = !!done;
  if (changed) {
    col.tasks.forEach(t => { t.completed = col.done; });
  }
}

function renderColumn(col) {
  const wrap = document.createElement("div");
  wrap.className = "column";
  wrap.dataset.flipId = col.id;
  wrap.dataset.colId = col.id;
  wrap.style.setProperty("--col-accent", col.accent);

  wrap.appendChild(renderColumnHead(col, wrap));
  wrap.appendChild(renderPalette(col));

  const list = document.createElement("div");
  list.className = "task-list";
  col.tasks.forEach(task => list.appendChild(renderTask(task, col)));
  list.addEventListener("click", e => handleListClick(e, col, list));
  wrap.appendChild(list);

  wrap.appendChild(renderAddTaskButton(col));

  return wrap;
}

function renderColumnHead(col, wrap) {
  const head = document.createElement("div");
  head.className = "column-head";

  const grip = document.createElement("span");
  grip.className = "column-grip";
  grip.textContent = "⠿";
  grip.title = "Drag to move column";
  grip.addEventListener("pointerdown", e => startColumnDrag(e, col, wrap));
  head.appendChild(grip);

  const swatch = document.createElement("span");
  swatch.className = "swatch";
  head.appendChild(swatch);

  if (col.done) {
    const badge = document.createElement("i");
    badge.className = "hgi hgi-stroke hgi-rounded hgi-checkmark-badge-01";

    head.appendChild(badge);
  }

  const titleEl = document.createElement("div");
  titleEl.className = "column-title";
  titleEl.textContent = col.title;
  titleEl.title = "Click to rename or configure";
  titleEl.addEventListener("click", () => {
    openEditor({
      title: col.title,
      showDesc: false,
      showDone: true,
      done: col.done,
      onSave: (newTitle, _desc, _labels, done) => {
        col.title = newTitle || "Untitled";
        applyColumnDone(col, done);
        saveState();
        render();
      }
    });
  });
  head.appendChild(titleEl);

  const count = document.createElement("span");
  count.className = "column-count";
  count.textContent = col.tasks.length;
  head.appendChild(count);

  const delBtn = document.createElement("button");
  delBtn.className = "column-del";
  delBtn.textContent = "x";
  delBtn.title = "Delete column";
  delBtn.addEventListener("click", () => {
    const flipState = captureFlipState();
    state.columns = state.columns.filter(c => c.id !== col.id);
    saveState();
    render();
    playFlip(flipState);
  });
  head.appendChild(delBtn);

  return head;
}

function renderPalette(col) {
  const palette = document.createElement("div");
  palette.className = "palette";

  const { r, g, b } = parseColor(col.accent);

  const picker = document.createElement("input");
  picker.type = "color";
  picker.className = "palette-color";
  picker.title = "Column color";
  picker.value = toHex(r, g, b);

  picker.addEventListener("input", () => {
    col.accent = picker.value;
    const colEl = palette.closest(".column");
    if (colEl) colEl.style.setProperty("--col-accent", col.accent);
  });
  picker.addEventListener("change", () => {
    saveState();
  });

  palette.appendChild(picker);
  return palette;
}

function renderAddTaskButton(col) {
  const addBtn = document.createElement("button");
  addBtn.className = "add-task-btn";
  addBtn.textContent = "+ add task";
  addBtn.addEventListener("click", () => {
    const flipState = captureFlipState();
    const t = newTaskObj("New task", col.done);
    col.tasks.push(t);
    saveState();
    render();
    playFlip(flipState);
    openEditor({
      title: t.title,
      desc: t.desc,
      showDesc: true,
      showLabels: true,
      labels: t.labels,
      onSave: (newTitle, newDesc, labels) => {
        t.title = newTitle || "Untitled";
        t.desc = newDesc;
        t.labels = labels || [];
        saveState();
        render();
      }
    });
  });
  return addBtn;
}

function renderTask(task, col) {
  const card = document.createElement("div");
  card.className = "task" + (task.completed ? " completed" : "");
  card.dataset.taskId = task.id;
  card.dataset.flipId = task.id;

  if (task.labels && task.labels.length) {
    const labelsRow = document.createElement("div");
    labelsRow.className = "task-labels";
    task.labels.forEach(l => {
      const chip = document.createElement("span");
      chip.className = "task-label";
      chip.textContent = l;
      chip.style.setProperty("--label-color", colorForLabel(l));
      labelsRow.appendChild(chip);
    });
    card.appendChild(labelsRow);
  }

  const title = document.createElement("div");
  title.className = "task-title";
  title.textContent = task.title;
  card.appendChild(title);

  const desc = document.createElement("div");
  desc.className = "task-desc";
  desc.textContent = task.desc || "";
  card.appendChild(desc);

  card.appendChild(renderTaskFoot(task, col));

  if (isClickToMove()) {
    card.addEventListener("click", e => handleTaskClick(e, card, task, col));
  } else {
    card.addEventListener("pointerdown", e => startDrag(e, card, task, col));
  }

  return card;
}

function renderTaskFoot(task, col) {
  const foot = document.createElement("div");
  foot.className = "task-foot";

  const editBtn = document.createElement("button");
  editBtn.className = "edit-task";
  editBtn.textContent = "edit";
  editBtn.addEventListener("click", e => {
    e.stopPropagation();
    openEditor({
      title: task.title,
      desc: task.desc,
      showDesc: true,
      showLabels: true,
      labels: task.labels,
      onSave: (newTitle, newDesc, labels) => {
        task.title = newTitle || "Untitled";
        task.desc = newDesc;
        task.labels = labels || [];
        saveState();
        render();
      }
    });
  });
  foot.appendChild(editBtn);

  const del = document.createElement("button");
  del.className = "del-task";
  del.textContent = "delete";
  del.addEventListener("click", e => {
    e.stopPropagation();
    const flipState = captureFlipState();
    col.tasks = col.tasks.filter(t => t.id !== task.id);
    saveState();
    render();
    playFlip(flipState);
  });
  foot.appendChild(del);

  return foot;
}

export function moveTaskTo(taskId, fromColId, toColId, index) {
  const fromCol = state.columns.find(c => c.id === fromColId);
  const toCol = state.columns.find(c => c.id === toColId);
  if (!fromCol || !toCol) return;
  const idx = fromCol.tasks.findIndex(t => t.id === taskId);
  if (idx === -1) return;

  const flipState = captureFlipState();
  const [task] = fromCol.tasks.splice(idx, 1);
  task.completed = toCol.done;
  toCol.tasks.splice(index, 0, task);
  saveState();
  render();
  playFlip(flipState);
}
