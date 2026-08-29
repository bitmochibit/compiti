(function(){
  "use strict";

  const STORAGE_KEY = "desk-board-state-v3";
  const ACCENTS = ["#e8a33d","#3dbfa8","#8b7ee8","#d9776f","#5fb0e0"];

  if(window.gsap && window.Flip){
    gsap.registerPlugin(Flip);
  }

  const defaultState = {
    settings: { blur: 0, dim: 0 },
    columns: [
      { id: cid(), title: "To Do", accent: ACCENTS[0], tasks: [
          { id: tid(), title: "Welcome to Desk Board", desc: "Click edit on a card to rename it, then drag cards between columns." }
        ]},
      { id: cid(), title: "In Progress", accent: ACCENTS[1], tasks: [] },
      { id: cid(), title: "Done", accent: ACCENTS[2], tasks: [] }
    ]
  };

  function cid(){ return "c-" + Math.random().toString(36).slice(2,9); }
  function tid(){ return "t-" + Math.random().toString(36).slice(2,9); }

  function loadState(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(raw){
        const parsed = JSON.parse(raw);
        if(!parsed.settings) parsed.settings = { blur: 0, dim: 0 };
        return parsed;
      }
    }catch(e){}
    return JSON.parse(JSON.stringify(defaultState));
  }

  function saveState(){
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch(e){}
  }

  let state = loadState();

  const board = document.getElementById("board");
  const totalEl = document.getElementById("taskTotal");
  const backdropBlur = document.getElementById("backdropBlur");
  const settingsToggle = document.getElementById("settingsToggle");
  const settingsPanel = document.getElementById("settingsPanel");
  const blurRange = document.getElementById("blurRange");
  const blurValue = document.getElementById("blurValue");
  const dimRange = document.getElementById("dimRange");
  const dimValue = document.getElementById("dimValue");

  const editOverlay = document.getElementById("editModalOverlay");
  const editTitleInput = document.getElementById("editTitleInput");
  const editDescInput = document.getElementById("editDescInput");
  const editDescRow = document.getElementById("editDescRow");
  const editSaveBtn = document.getElementById("editSaveBtn");
  const editCancelBtn = document.getElementById("editCancelBtn");

  function applySettings(){
    const blur = state.settings.blur;
    const dim = state.settings.dim;
    backdropBlur.style.backdropFilter = "blur(" + blur + "px)";
    backdropBlur.style.webkitBackdropFilter = "blur(" + blur + "px)";
    backdropBlur.style.background = "rgba(0,0,0," + (dim / 100).toFixed(2) + ")";
    blurRange.value = blur;
    blurValue.textContent = blur + "px";
    dimRange.value = dim;
    dimValue.textContent = dim + "%";
  }

  settingsToggle.addEventListener("click", () => {
    settingsPanel.classList.toggle("open");
  });

  blurRange.addEventListener("input", () => {
    state.settings.blur = Number(blurRange.value);
    applySettings();
    saveState();
  });

  dimRange.addEventListener("input", () => {
    state.settings.dim = Number(dimRange.value);
    applySettings();
    saveState();
  });

  let editSaveCallback = null;

  function openEditor(options){
    editTitleInput.value = options.title || "";
    editDescInput.value = options.desc || "";
    editDescRow.style.display = options.showDesc ? "flex" : "none";
    editSaveCallback = options.onSave;
    editOverlay.classList.add("open");
    requestAnimationFrame(()=> editTitleInput.focus());
  }

  function closeEditor(){
    editOverlay.classList.remove("open");
    editSaveCallback = null;
  }

  editCancelBtn.addEventListener("click", closeEditor);
  editOverlay.addEventListener("click", e=>{ if(e.target === editOverlay) closeEditor(); });
  editSaveBtn.addEventListener("click", ()=>{
    if(editSaveCallback) editSaveCallback(editTitleInput.value.trim(), editDescInput.value.trim());
    closeEditor();
  });

  function countTasks(){
    return state.columns.reduce((n,c)=>n+c.tasks.length,0);
  }

  function captureFlipState(){
    if(!window.Flip) return null;
    return Flip.getState("[data-flip-id]");
  }

  function playFlip(flipState){
    if(!flipState || !window.Flip) return;
    Flip.from(flipState, {
      duration: 0.45,
      ease: "power2.out",
      absolute: true,
      stagger: 0.02,
      nested: true
    });
  }

  function render(){
    board.innerHTML = "";
    state.columns.forEach(col=>{
      board.appendChild(renderColumn(col));
    });

    const addCol = document.createElement("div");
    addCol.className = "new-column";
    addCol.textContent = "+ NEW COLUMN";
    addCol.addEventListener("click", ()=>{
      const flipState = captureFlipState();
      const col = { id: cid(), title: "New column", accent: ACCENTS[state.columns.length % ACCENTS.length], tasks: [] };
      state.columns.push(col);
      saveState(); render();
      playFlip(flipState);
      openEditor({
        title: col.title,
        showDesc: false,
        onSave: newTitle=>{
          col.title = newTitle || "Untitled";
          saveState(); render();
        }
      });
    });
    board.appendChild(addCol);

    const n = countTasks();
    totalEl.textContent = n + (n === 1 ? " task" : " task");
  }

  function renderColumn(col){
    const wrap = document.createElement("div");
    wrap.className = "column";
    wrap.dataset.flipId = col.id;
    wrap.dataset.colId = col.id;
    wrap.style.setProperty("--col-accent", col.accent);

    const head = document.createElement("div");
    head.className = "column-head";
    head.innerHTML = `<span class="swatch"></span>`;

    const titleEl = document.createElement("div");
    titleEl.className = "column-title";
    titleEl.textContent = col.title;
    titleEl.title = "Click to rename";
    titleEl.addEventListener("click", ()=>{
      openEditor({
        title: col.title,
        showDesc: false,
        onSave: newTitle=>{
          col.title = newTitle || "Untitled";
          saveState(); render();
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
    delBtn.addEventListener("click", ()=>{
      const flipState = captureFlipState();
      state.columns = state.columns.filter(c=>c.id !== col.id);
      saveState(); render();
      playFlip(flipState);
    });
    head.appendChild(delBtn);

    wrap.appendChild(head);

    const palette = document.createElement("div");
    palette.className = "palette";
    ACCENTS.forEach(c=>{
      const b = document.createElement("b");
      b.style.background = c;
      b.addEventListener("click", ()=>{
        col.accent = c;
        saveState(); render();
      });
      palette.appendChild(b);
    });
    wrap.appendChild(palette);

    const list = document.createElement("div");
    list.className = "task-list";

    col.tasks.forEach(task=>{
      list.appendChild(renderTask(task, col));
    });
    wrap.appendChild(list);

    const addBtn = document.createElement("button");
    addBtn.className = "add-task-btn";
    addBtn.textContent = "+ add task";
    addBtn.addEventListener("click", ()=>{
      const flipState = captureFlipState();
      const t = { id: tid(), title: "New task", desc: "" };
      col.tasks.push(t);
      saveState(); render();
      playFlip(flipState);
      openEditor({
        title: t.title,
        desc: t.desc,
        showDesc: true,
        onSave: (newTitle, newDesc)=>{
          t.title = newTitle || "Untitled";
          t.desc = newDesc;
          saveState(); render();
        }
      });
    });
    wrap.appendChild(addBtn);

    return wrap;
  }

  function renderTask(task, col){
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

    const foot = document.createElement("div");
    foot.className = "task-foot";

    const editBtn = document.createElement("button");
    editBtn.className = "edit-task";
    editBtn.textContent = "edit";
    editBtn.addEventListener("click", e=>{
      e.stopPropagation();
      openEditor({
        title: task.title,
        desc: task.desc,
        showDesc: true,
        onSave: (newTitle, newDesc)=>{
          task.title = newTitle || "Untitled";
          task.desc = newDesc;
          saveState(); render();
        }
      });
    });
    foot.appendChild(editBtn);

    const del = document.createElement("button");
    del.className = "del-task";
    del.textContent = "delete";
    del.addEventListener("click", e=>{
      e.stopPropagation();
      const flipState = captureFlipState();
      col.tasks = col.tasks.filter(t=>t.id !== task.id);
      saveState(); render();
      playFlip(flipState);
    });
    foot.appendChild(del);

    card.appendChild(foot);

    card.addEventListener("pointerdown", e=> startDrag(e, card, task, col));

    return card;
  }

  function startDrag(e, card, task, col){
    if(e.target.closest("button")) return;
    if(e.button !== undefined && e.button !== 0) return;
    e.preventDefault();

    const rect = card.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    card.setPointerCapture(e.pointerId);
    card.classList.add("dragging");
    card.style.position = "fixed";
    card.style.left = rect.left + "px";
    card.style.top = rect.top + "px";
    card.style.width = rect.width + "px";
    card.style.zIndex = "1000";

    function onMove(ev){
      card.style.left = (ev.clientX - offsetX) + "px";
      card.style.top = (ev.clientY - offsetY) + "px";
      document.querySelectorAll(".column").forEach(c=>c.classList.remove("drag-over"));
      const colEl = columnFromPoint(ev.clientX, ev.clientY);
      if(colEl) colEl.classList.add("drag-over");
    }

    function onUp(ev){
      card.removeEventListener("pointermove", onMove);
      card.removeEventListener("pointerup", onUp);
      card.removeEventListener("pointercancel", onUp);
      document.querySelectorAll(".column").forEach(c=>c.classList.remove("drag-over"));

      card.classList.remove("dragging");
      card.style.position = "";
      card.style.left = "";
      card.style.top = "";
      card.style.width = "";
      card.style.zIndex = "";

      const colEl = columnFromPoint(ev.clientX, ev.clientY);
      if(colEl){
        const targetColId = colEl.dataset.colId;
        const list = colEl.querySelector(".task-list");
        const index = getDropIndex(list, ev.clientY, task.id);
        moveTaskTo(task.id, col.id, targetColId, index);
      }else{
        render();
      }
    }

    card.addEventListener("pointermove", onMove);
    card.addEventListener("pointerup", onUp);
    card.addEventListener("pointercancel", onUp);
  }

  function columnFromPoint(x, y){
    const el = document.elementFromPoint(x, y);
    if(!el) return null;
    return el.closest(".column");
  }

  function getDropIndex(listEl, clientY, excludeId){
    const items = Array.from(listEl.querySelectorAll(".task")).filter(el=>el.dataset.taskId !== excludeId);
    for(let i = 0; i < items.length; i++){
      const rect = items[i].getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      if(clientY < mid) return i;
    }
    return items.length;
  }

  function moveTaskTo(taskId, fromColId, toColId, index){
    const fromCol = state.columns.find(c=>c.id === fromColId);
    const toCol = state.columns.find(c=>c.id === toColId);
    if(!fromCol || !toCol) return;
    const idx = fromCol.tasks.findIndex(t=>t.id === taskId);
    if(idx === -1) return;

    const flipState = captureFlipState();
    const [task] = fromCol.tasks.splice(idx, 1);
    let insertAt = index;
    if(fromCol === toCol && idx < insertAt) insertAt -= 1;
    toCol.tasks.splice(insertAt, 0, task);
    saveState(); render();
    playFlip(flipState);
  }

  function tickClock(){
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    document.getElementById("clock").textContent = hh + ":" + mm;
  }
  tickClock();
  setInterval(tickClock, 1000 * 15);

  applySettings();
  render();
})();
