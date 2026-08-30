const STORAGE_KEY = "desk-board-state-v3";
export const ACCENTS = ["#e8a33d", "#3dbfa8", "#8b7ee8", "#d9776f", "#5fb0e0"];
export const LABEL_COLORS = [
  "#e8a33d", "#3dbfa8", "#8b7ee8", "#d9776f",
  "#5fb0e0", "#e06c9f", "#7ad67a", "#e0c250"
];

function cid() {
  return "c-" + Math.random().toString(36).slice(2, 9);
}

function tid() {
  return "t-" + Math.random().toString(36).slice(2, 9);
}

export function parseColor(str) {
  const fallback = { r: 232, g: 163, b: 61 };
  if (!str) return fallback;
  const rgbMatch = str.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgbMatch) {
    return { r: +rgbMatch[1], g: +rgbMatch[2], b: +rgbMatch[3] };
  }
  const hex = str.trim().replace(/^#/, "");
  if (/^[0-9a-f]{6}$/i.test(hex)) {
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16)
    };
  }
  return fallback;
}

export function toHex(r, g, b) {
  const h = n => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return "#" + h(r) + h(g) + h(b);
}

export function colorForLabel(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return LABEL_COLORS[h % LABEL_COLORS.length];
}

export function newTaskObj(title, done) {
  return {
    id: tid(),
    title: title || "New task",
    desc: "",
    labels: [],
    completed: !!done
  };
}

function defaultState() {
  return {
    settings: {
      blur: 0,
      dim: 0,
      bgUrl: "",
      clickToMove: false,
      muted: false,
      accentColor: "#e8a33d",
      sounds: { pickup: "", drop: "", hop: "" }
    },
    columns: [
      {
        id: cid(),
        title: "To Do",
        accent: ACCENTS[0],
        done: false,
        tasks: [
          {
            id: tid(),
            title: "Welcome to Desk Board",
            desc: "Click edit on a card to rename it, then drag cards between columns.",
            labels: ["welcome"],
            completed: false
          }
        ]
      },
      { id: cid(), title: "In Progress", accent: ACCENTS[1], done: false, tasks: [] },
      { id: cid(), title: "Done", accent: ACCENTS[2], done: true, tasks: [] }
    ]
  };
}

function migrate(parsed) {
  if (!parsed.settings) parsed.settings = {};
  if (parsed.settings.blur === undefined) parsed.settings.blur = 0;
  if (parsed.settings.dim === undefined) parsed.settings.dim = 0;
  if (parsed.settings.bgUrl === undefined) parsed.settings.bgUrl = "";
  if (parsed.settings.clickToMove === undefined) parsed.settings.clickToMove = false;
  if (parsed.settings.muted === undefined) parsed.settings.muted = false;
  if (parsed.settings.accentColor === undefined) parsed.settings.accentColor = "#e8a33d";
  if (!parsed.settings.sounds || typeof parsed.settings.sounds !== "object") parsed.settings.sounds = {};
  if (parsed.settings.sounds.pickup === undefined) parsed.settings.sounds.pickup = "";
  if (parsed.settings.sounds.drop === undefined) parsed.settings.sounds.drop = "";
  if (parsed.settings.sounds.hop === undefined) parsed.settings.sounds.hop = "";

  if (!Array.isArray(parsed.columns)) parsed.columns = [];
  parsed.columns.forEach(col => {
    if (col.done === undefined) col.done = false;
    if (!Array.isArray(col.tasks)) col.tasks = [];
    col.tasks.forEach(t => {
      if (!Array.isArray(t.labels)) t.labels = [];
      if (t.completed === undefined) t.completed = false;
      if (t.desc === undefined) t.desc = "";
    });
  });

  return parsed;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return migrate(JSON.parse(raw));
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
