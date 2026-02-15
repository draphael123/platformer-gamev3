import SaveManager from './SaveManager.js';

export const ACHIEVEMENT_IDS = {
  FIRST_COIN: 'first_coin',
  COMBO_3: 'combo_3',
  FIRST_STOMP: 'first_stomp',
  FIRST_DEATH: 'first_death',
  LEVEL_1_CLEAR: 'level_1_clear',
  LEVEL_2_CLEAR: 'level_2_clear',
  LEVEL_3_CLEAR: 'level_3_clear',
  GROUND_POUND: 'ground_pound',
  BIG_MUSHROOM: 'big_mushroom',
  FIRST_WARP: 'first_warp',
  SPEEDRUN_60: 'speedrun_60',
  ALL_COINS_L1: 'all_coins_l1',
};

export const ACHIEVEMENT_TITLES = {
  [ACHIEVEMENT_IDS.FIRST_COIN]: 'First Coin',
  [ACHIEVEMENT_IDS.COMBO_3]: 'Combo x3',
  [ACHIEVEMENT_IDS.FIRST_STOMP]: 'First Stomp',
  [ACHIEVEMENT_IDS.FIRST_DEATH]: 'Ouch!',
  [ACHIEVEMENT_IDS.LEVEL_1_CLEAR]: 'Level 1 Clear',
  [ACHIEVEMENT_IDS.LEVEL_2_CLEAR]: 'Level 2 Clear',
  [ACHIEVEMENT_IDS.LEVEL_3_CLEAR]: 'Level 3 Clear',
  [ACHIEVEMENT_IDS.GROUND_POUND]: 'Ground Pound',
  [ACHIEVEMENT_IDS.BIG_MUSHROOM]: 'Super Size',
  [ACHIEVEMENT_IDS.FIRST_WARP]: 'First Warp',
  [ACHIEVEMENT_IDS.SPEEDRUN_60]: 'Under 60s',
  [ACHIEVEMENT_IDS.ALL_COINS_L1]: 'All Coins 1-1',
};

export function tryUnlock(id) {
  return SaveManager.unlockAchievement(id);
}

export function getUnlocked() {
  return SaveManager.getAchievements();
}

export function isUnlocked(id) {
  return !!(SaveManager.getAchievements()[id]);
}

export default { ACHIEVEMENT_IDS, ACHIEVEMENT_TITLES, tryUnlock, getUnlocked, isUnlocked };
