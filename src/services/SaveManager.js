import { SAVE_KEY } from '../constants.js';

const DEFAULTS = {
  lastLevel: 1,
  lives: 3,
  highScore: 0,
  bestTimes: {},
  levelCoins: {},
  achievements: {},
  unlockedLevels: [1],
  continueState: null,
  musicVolume: 0.7,
  sfxVolume: 0.8,
  reducedMotion: false,
  fullscreen: false,
  difficulty: 'normal',
  highContrast: false,
  uiScale: 1,
  hintsSeen: {},
  keyBindings: {},
};

export function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { ...DEFAULTS };
    const data = JSON.parse(raw);
    return { ...DEFAULTS, ...data };
  } catch {
    return { ...DEFAULTS };
  }
}

export function save(data) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Save failed', e);
  }
}

export function setHighScore(score) {
  const d = load();
  if (score > d.highScore) {
    d.highScore = score;
    save(d);
    return true;
  }
  return false;
}

export function setBestTime(levelKey, timeSeconds) {
  const d = load();
  const prev = d.bestTimes[levelKey];
  if (prev == null || timeSeconds < prev) {
    d.bestTimes[levelKey] = timeSeconds;
    save(d);
    return true;
  }
  return false;
}

export function getAchievements() {
  return load().achievements || {};
}

export function unlockAchievement(id) {
  const d = load();
  if (!d.achievements) d.achievements = {};
  if (d.achievements[id]) return false;
  d.achievements[id] = Date.now();
  save(d);
  return true;
}

export function getUnlockedLevels() {
  return load().unlockedLevels || [1];
}

export function setUnlockedLevel(levelIndex) {
  const d = load();
  if (!d.unlockedLevels) d.unlockedLevels = [1];
  if (!d.unlockedLevels.includes(levelIndex)) {
    d.unlockedLevels.push(levelIndex);
    d.unlockedLevels.sort((a, b) => a - b);
    save(d);
    return true;
  }
  return false;
}

export function getLevelCoins(levelKey) {
  return (load().levelCoins || {})[levelKey] ?? 0;
}

export function setLevelCoins(levelKey, count) {
  const d = load();
  if (!d.levelCoins) d.levelCoins = {};
  const prev = d.levelCoins[levelKey];
  if (prev == null || count > prev) {
    d.levelCoins[levelKey] = count;
    save(d);
    return true;
  }
  return false;
}

export function saveContinueState(level, lives) {
  const d = load();
  d.continueState = { level, lives };
  save(d);
}

export function loadContinueState() {
  return load().continueState || null;
}

export function clearContinueState() {
  const d = load();
  d.continueState = null;
  save(d);
}

export function setHintSeen(id) {
  const d = load();
  if (!d.hintsSeen) d.hintsSeen = {};
  d.hintsSeen[id] = true;
  save(d);
}

export function hasHintSeen(id) {
  return !!(load().hintsSeen || {})[id];
}

export default {
  load, save, setHighScore, setBestTime, getAchievements, unlockAchievement,
  getUnlockedLevels, setUnlockedLevel, getLevelCoins, setLevelCoins,
  saveContinueState, loadContinueState, clearContinueState, setHintSeen, hasHintSeen,
};
