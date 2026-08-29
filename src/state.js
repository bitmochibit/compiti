const STORAGE_KEY = "desk-board-state-v3";
export const ACCENTS = ["#e8a33d", "#3dbfa8", "#8b7ee8", "#d9776f", "#5fb0e0"];

function cid() {
  return "c-" + Math.random().toString(36).slice(2, 9);
}

function tid() {
  return "t-" + Math.random().toString(36).slice(2, 9);
}

function defaultState() {
  return {
    settings: { blur: 0, dim: 0, bgUrl: "" },
    columns: [
      {
        id: cid(),
        title: "To Do",
        accent: ACCENTS[0],
        tasks: [
          {
            id: tid(),
            title: "Welcome to Desk Board",
            desc: "Click edit on a card to rename it, then drag cards between columns."
          }
        ]
      },
      { id: cid(), title: "In Progress", accent: ACCENTS[1], tasks: [] },
      { id: cid(), title: "Done", accent: ACCENTS[2], tasks: [] }
    ]
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!parsed.settings) parsed.settings = { blur: 0, dim: 0, bgUrl: "" };
      if (parsed.settings.bgUrl === undefined) parsed.settings.bgUrl = "";
      return parsed;
    }
  } catch (e) {}
  return defaultState();
}

export const state = loadState();

export function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {}
}

export function newColumnId() {
  return cid();
}

export function newTaskId() {
  return tid();
}
