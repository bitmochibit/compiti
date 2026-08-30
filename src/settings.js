import { state, saveState } from "./state.js";
import { render } from "./board.js";
import {
  backdropBlur,
  settingsToggle,
  settingsPanel,
  blurRange,
  blurValue,
  dimRange,
  dimValue,
  bgUrlInput,
  bgClearBtn,
  backgroundImage,
  backgroundVideo,
  clickToMoveToggle,
  accentColorInput,
  muteToggle,
  soundPickupInput,
  soundDropInput,
  soundHopInput,
  soundsResetBtn,
  exportSettingsBtn,
  importSettingsBtn,
  importSettingsFile
} from "./dom.js";
import { previewSound } from "./audio.js";

const VIDEO_PATTERN = /\.(mp4|webm|ogg|mov)(\?.*)?$/i;

export function applySettings() {
  applyBlurAndDim();
  applyBackground();
  applyInteractionMode();
  applyAccentColor();
  applyMute();
  applySounds();
}

function applySounds() {
  const sounds = state.settings.sounds || {};
  soundPickupInput.value = sounds.pickup || "";
  soundDropInput.value = sounds.drop || "";
  soundHopInput.value = sounds.hop || "";
}

function applyBlurAndDim() {
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

function hideBackgroundMedia() {
  backgroundImage.removeAttribute("src");
  backgroundImage.style.display = "none";
  backgroundVideo.pause();
  backgroundVideo.removeAttribute("src");
  backgroundVideo.style.display = "none";
}

function applyBackground() {
  const url = state.settings.bgUrl || "";
  bgUrlInput.value = url;

  if (!url) {
    hideBackgroundMedia();
    return;
  }

  if (VIDEO_PATTERN.test(url)) {
    backgroundImage.removeAttribute("src");
    backgroundImage.style.display = "none";
    if (backgroundVideo.getAttribute("src") !== url) {
      backgroundVideo.src = url;
    }
    backgroundVideo.style.display = "block";
    backgroundVideo.play().catch(() => {});
  } else {
    backgroundVideo.pause();
    backgroundVideo.removeAttribute("src");
    backgroundVideo.style.display = "none";
    backgroundImage.src = url;
    backgroundImage.style.display = "block";
  }
}

function applyInteractionMode() {
  clickToMoveToggle.checked = !!state.settings.clickToMove;
  document.body.classList.toggle("click-to-move-mode", !!state.settings.clickToMove);
}

function applyAccentColor() {
  const color = state.settings.accentColor || "#e8a33d";
  document.documentElement.style.setProperty("--amber", color);
  accentColorInput.value = color;
}

function applyMute() {
  muteToggle.checked = !!state.settings.muted;
}

settingsToggle.addEventListener("click", () => {
  settingsPanel.classList.toggle("open");
});

blurRange.addEventListener("input", () => {
  state.settings.blur = Number(blurRange.value);
  applyBlurAndDim();
  saveState();
});

dimRange.addEventListener("input", () => {
  state.settings.dim = Number(dimRange.value);
  applyBlurAndDim();
  saveState();
});

function commitBgUrl() {
  const url = bgUrlInput.value.trim();
  state.settings.bgUrl = url;
  applyBackground();
  saveState();
}

bgUrlInput.addEventListener("change", commitBgUrl);

bgUrlInput.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    e.preventDefault();
    bgUrlInput.blur();
  }
});

bgClearBtn.addEventListener("click", () => {
  bgUrlInput.value = "";
  commitBgUrl();
});

clickToMoveToggle.addEventListener("change", () => {
  state.settings.clickToMove = clickToMoveToggle.checked;
  applyInteractionMode();
  saveState();
  render();
});

accentColorInput.addEventListener("input", () => {
  state.settings.accentColor = accentColorInput.value;
  applyAccentColor();
  saveState();
});

muteToggle.addEventListener("change", () => {
  state.settings.muted = muteToggle.checked;
  saveState();
});

function commitSound(key, input) {
  const url = input.value.trim();
  if (!state.settings.sounds) state.settings.sounds = { pickup: "", drop: "", hop: "" };
  state.settings.sounds[key] = url;
  saveState();
  if (url) previewSound(url);
}

[
  [soundPickupInput, "pickup"],
  [soundDropInput, "drop"],
  [soundHopInput, "hop"]
].forEach(([input, key]) => {
  input.addEventListener("change", () => commitSound(key, input));
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      input.blur();
    }
  });
});

soundsResetBtn.addEventListener("click", () => {
  state.settings.sounds = { pickup: "", drop: "", hop: "" };
  applySounds();
  saveState();
});

function exportSettings() {
  const data = JSON.stringify(state.settings, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "desk-board-settings.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function importSettings(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      state.settings = {
        ...state.settings,
        ...imported,
        sounds: { ...state.settings.sounds, ...(imported.sounds || {}) }
      };
      applySettings();
      saveState();
    } catch (e) {
      alert("That file isn't valid settings JSON.");
    }
  };
  reader.readAsText(file);
}

exportSettingsBtn.addEventListener("click", exportSettings);

importSettingsBtn.addEventListener("click", () => importSettingsFile.click());

importSettingsFile.addEventListener("change", () => {
  const file = importSettingsFile.files[0];
  if (file) importSettings(file);
  importSettingsFile.value = "";
});
