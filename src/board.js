import { state, saveState, ACCENTS, newColumnId, newTaskId } from "./state.js";
import { board, totalEl } from "./dom.js";
import { openEditor } from "./modal.js";
import { startDrag } from "./drag.js";

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
      tasks: []
    };
    state.columns.push(col);
    saveState();
    render();
    playFlip(flipState);
    openEditor({
      title: col.title,
      showDesc: false,
      onSave: newTitle => {
        col.title = newTitle || "Untitled";
        saveState();
        render();
      }
    });
  });
  return addCol;
}

function renderColumn(col) {
  const wrap = document.createElement("div");
  wrap.className = "column";
  wrap.dataset.flipId = col.id;
  wrap.dataset.colId = col.id;
  wrap.style.setProperty("--col-accent", col.accent);

  wrap.appendChild(renderColumnHead(col));
  wrap.appendChild(renderPalette(col));

  const list = document.createElement("div");
  list.className = "task-list";
  col.tasks.forEach(task => list.appendChild(renderTask(task, col)));
  wrap.appendChild(list);

  wrap.appendChild(renderAddTaskButton(col));

  return wrap;
}

function renderColumnHead(col) {
  const head = document.createElement("div");
  head.className = "column-head";
  head.innerHTML = '<span class="swatch"></span>';

  const titleEl = document.createElement("div");
  titleEl.className = "column-title";
  titleEl.textContent = col.title;
  titleEl.title = "Click to rename";
  titleEl.addEventListener("click", () => {
    openEditor({
      title: col.title,
      showDesc: false,
      onSave: newTitle => {
        col.title = newTitle || "Untitled";
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
  ACCENTS.forEach(c => {
    const b = document.createElement("b");
    b.style.background = c;
    b.addEventListener("click", () => {
      col.accent = c;
      saveState();
      render();
    });
    palette.appendChild(b);
  });
  return palette;
}

function renderAddTaskButton(col) {
  const addBtn = document.createElement("button");
  addBtn.className = "add-task-btn";
  addBtn.textContent = "+ add task";
  addBtn.addEventListener("click", () => {
    const flipState = captureFlipState();
    const t = { id: newTaskId(), title: "New task", desc: "" };
    col.tasks.push(t);
    saveState();
    render();
    playFlip(flipState);
    openEditor({
      title: t.title,
      desc: t.desc,
      showDesc: true,
      onSave: (newTitle, newDesc) => {
        t.title = newTitle || "Untitled";
        t.desc = newDesc;
        saveState();
        render();
      }
    });
  });
  return addBtn;
}

function renderTask(task, col) {
  const card = document.createElement("div");
  card.className = "task";
  card.dataset.taskId = task.id;
  card.dataset.flipId = task.id;

  const title = document.createElement("div");
  title.className = "task-title";
  title.textContent = task.title;
  card.appendChild(title);

  const desc = document.createElement("div");
  desc.className = "task-desc";
  desc.textContent = task.desc || "";
  card.appendChild(desc);

  card.appendChild(renderTaskFoot(task, col));

  card.addEventListener("pointerdown", e => startDrag(e, card, task, col));

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
      onSave: (newTitle, newDesc) => {
        task.title = newTitle || "Untitled";
        task.desc = newDesc;
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
  let insertAt = index;
  if (fromCol === toCol && idx < insertAt) insertAt -= 1;
  toCol.tasks.splice(insertAt, 0, task);
  saveState();
  render();
  playFlip(flipState);
}
