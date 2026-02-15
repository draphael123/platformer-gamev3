import SaveManager from './SaveManager.js';

let sceneRef = null;
let audioCtx = null;

function getCtx() {
  if (audioCtx) return audioCtx;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  } catch (_) {}
  return audioCtx;
}

function pitchVariation() {
  return 0.92 + Math.random() * 0.16;
}

function beep(freq, durationMs, type = 'sine', volume = 0.15, pitchMult = 1) {
  const ctx = getCtx();
  if (!ctx) return;
  const data = SaveManager.load();
  const vol = volume * (data.sfxVolume ?? 0.8);
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq * pitchMult;
    osc.type = type;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + durationMs / 1000);
  } catch (_) {}
}

export function init(scene) {
  sceneRef = scene;
}

export function playSfx(key, volume) {
  if (!sceneRef || !sceneRef.sound) return;
  const data = SaveManager.load();
  const vol = (volume != null ? volume : 1) * (data.sfxVolume ?? 0.8);
  try {
    if (sceneRef.sound.get(key)) sceneRef.sound.play(key, { volume: vol });
  } catch (_) {}
}

export function playJump() {
  beep(440, 60, 'sine', 0.12, pitchVariation());
}

export function playCoin() {
  beep(880, 80, 'square', 0.1, pitchVariation());
}

export function playStomp() {
  beep(120, 100, 'sawtooth', 0.12, pitchVariation());
}

export function playDeath() {
  beep(200, 200, 'sawtooth', 0.15);
  setTimeout(() => beep(150, 300, 'sawtooth', 0.12), 150);
}

export function playLevelClear() {
  beep(523, 120, 'sine', 0.12);
  setTimeout(() => beep(659, 120, 'sine', 0.12), 100);
  setTimeout(() => beep(784, 120, 'sine', 0.12), 200);
  setTimeout(() => beep(1047, 280, 'sine', 0.12), 300);
}

export function playWarp() {
  beep(330, 100, 'sine', 0.1);
  setTimeout(() => beep(440, 150, 'sine', 0.1), 80);
}

export function playBrick() {
  beep(180, 80, 'sawtooth', 0.12);
}

export function playQuestion() {
  beep(660, 70, 'square', 0.1);
}

export function playLowTime() {
  beep(200, 60, 'square', 0.08);
}

export function playOneUp() {
  beep(523, 100, 'sine', 0.12);
  setTimeout(() => beep(659, 100, 'sine', 0.12), 100);
  setTimeout(() => beep(784, 100, 'sine', 0.12), 200);
  setTimeout(() => beep(1047, 200, 'sine', 0.12), 300);
}

export function playMusic(key, loop = true) {
  if (!sceneRef || !sceneRef.sound) return;
  const data = SaveManager.load();
  try {
    if (sceneRef.sound.get(key)) {
      sceneRef.sound.play(key, { volume: data.musicVolume ?? 0.7, loop });
    }
  } catch (_) {}
}

export function stopMusic(key) {
  if (!sceneRef || !sceneRef.sound) return;
  try {
    if (sceneRef.sound.get(key)) sceneRef.sound.get(key).stop();
  } catch (_) {}
}

export function isReducedMotion() {
  return (SaveManager.load().reducedMotion ?? false);
}

export default {
  init, playSfx, playMusic, stopMusic, isReducedMotion,
  playJump, playCoin, playStomp, playDeath, playLevelClear,
  playWarp, playBrick, playQuestion, playLowTime, playOneUp,
};
