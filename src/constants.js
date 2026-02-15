/** Central constants for the game */
export const EVENTS = {
  COIN_COLLECTED: 'coin-collected',
  PLAYER_DIED: 'player-died',
  LEVEL_CLEAR: 'level-clear',
  CHECKPOINT: 'checkpoint',
  GROUND_POUND_LAND: 'ground-pound-land',
  LIVES_CHANGED: 'lives-changed',
  BRICK_BROKEN: 'brick-broken',
  QUESTION_HIT: 'question-hit',
  KEY_COLLECTED: 'key-collected',
  DOOR_OPENED: 'door-opened',
};

export const DEPTH = {
  BACKGROUND: 0,
  BACK_PARALLAX: 1,
  TILES: 10,
  PICKUPS: 20,
  ENEMIES: 25,
  PLAYER: 30,
  FOREGROUND: 40,
  UI: 100,
  PAUSE_OVERLAY: 200,
};

export const DEFAULT_LIVES = 3;
export const EASY_LIVES = 5;
export const LEVEL_TIME_LIMIT = 300;
export const LEVEL_TIME_LIMIT_EASY = 400;
export const SAVE_KEY = 'platformer-v3-save';
export const INVINCIBILITY_DURATION_MS = 8000;
export const WATER_BREATH_SECONDS = 30;
export const LOW_TIME_WARNING_SECONDS = 60;
export const BRICK_SCORE = 50;
export const QUESTION_BOUNCE_VELOCITY = 120;
export const FLAGPOLE_BASE_SCORE = 100;
export const FLAGPOLE_HEIGHT_BONUS = 50;
export const DEATH_ANIM_DURATION = 600;
export const READY_SCREEN_DURATION = 2000;
export const CAMERA_LEAD_X = 40;
export const FADE_DURATION = 400;

export default {
  EVENTS, DEPTH, DEFAULT_LIVES, EASY_LIVES, LEVEL_TIME_LIMIT, LEVEL_TIME_LIMIT_EASY,
  SAVE_KEY, INVINCIBILITY_DURATION_MS, WATER_BREATH_SECONDS, LOW_TIME_WARNING_SECONDS,
  BRICK_SCORE, QUESTION_BOUNCE_VELOCITY, FLAGPOLE_BASE_SCORE, FLAGPOLE_HEIGHT_BONUS,
  DEATH_ANIM_DURATION, READY_SCREEN_DURATION, CAMERA_LEAD_X, FADE_DURATION,
};
