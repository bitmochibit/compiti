import { state, saveState } from "./state.js";
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
  backgroundVideo
} from "./dom.js";

const VIDEO_PATTERN = /\.(mp4|webm|ogg|mov)(\?.*)?$/i;

export function applySettings() {
  applyBlurAndDim();
  applyBackground();
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
