import { state } from "./state.js";

const audioCache = {};

function getCustomAudio(url) {
  if (!audioCache[url]) {
    const a = new Audio(url);
    a.preload = "auto";
    audioCache[url] = a;
  }
  return audioCache[url];
}

function getRandom(min, max) {
  return Math.random() * (max - min) + min;
}

function playCustom(url, pitchRatio = 1) {
  try {
    const base = getCustomAudio(url);
    const el = base.cloneNode(true);
    el.volume = 1;

    el.playbackRate = Math.max(0.5, Math.min(4.0, pitchRatio));
    el.preservesPitch = false;

    el.play().catch(() => {});
  } catch (e) {}
}

function playAction(key, toneOpts) {
  if (state.settings.muted) return;

  const pitchRange = toneOpts.pitchRange ?? 0.1;
  const pitchMultiplier = getRandom(1 - pitchRange, 1 + pitchRange);

  const url = state.settings.sounds && state.settings.sounds[key];
  if (url) {
    playCustom(url, pitchMultiplier);
  } else {
    tone({ ...toneOpts, pitchMultiplier });
  }
}

let ctx = null;

function getCtx() {
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    ctx = new AudioCtx();
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

function tone({
                freq = 440,
                freqTo = null,
                duration = 0.09,
                type = "sine",
                gain = 0.06,
                pitchMultiplier = 1,
              }) {
  if (state.settings.muted) return;
  const audioCtx = getCtx();
  if (!audioCtx) return;
  try {
    const startFreq = freq * pitchMultiplier;
    const endFreq = freqTo ? freqTo * pitchMultiplier : null;

    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = type;

    osc.frequency.setValueAtTime(startFreq, audioCtx.currentTime);
    if (endFreq) {
      if (endFreq > 0) {
        osc.frequency.exponentialRampToValueAtTime(endFreq, audioCtx.currentTime + duration);
      } else {
        osc.frequency.linearRampToValueAtTime(endFreq, audioCtx.currentTime + duration);
      }
    }

    g.gain.setValueAtTime(gain, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    osc.connect(g);
    g.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration + 0.02);
  } catch (e) {}
}

export function playPickup() {
  playAction("pickup", { freq: 320, freqTo: 480, duration: 0.09, type: "sine", gain: 0.05, pitchRange: 0.12 });
}

export function playDrop() {
  playAction("drop", { freq: 260, freqTo: 150, duration: 0.13, type: "sine", gain: 0.06, pitchRange: 0.08 });
}

export function playHop() {
  playAction("hop", { freq: 560, duration: 0.045, type: "triangle", gain: 0.03, pitchRange: 0.08 });
}

export function previewSound(url) {
  if (!url) return;
  playCustom(url, 1);
}
