import Phaser from 'phaser';
import Player from '../entities/Player.js';
import Enemy from '../entities/Enemy.js';
import FlyingEnemy from '../entities/FlyingEnemy.js';
import Fireball from '../entities/Fireball.js';
import {
  EVENTS, DEPTH, DEFAULT_LIVES, LEVEL_TIME_LIMIT, LEVEL_TIME_LIMIT_EASY,
  INVINCIBILITY_DURATION_MS, WATER_BREATH_SECONDS, LOW_TIME_WARNING_SECONDS,
  BRICK_SCORE, QUESTION_BOUNCE_VELOCITY, FLAGPOLE_BASE_SCORE, FLAGPOLE_HEIGHT_BONUS,
  DEATH_ANIM_DURATION, READY_SCREEN_DURATION, CAMERA_LEAD_X, FADE_DURATION,
} from '../constants.js';
import SaveManager from '../services/SaveManager.js';
import AudioManager from '../services/AudioManager.js';
import EventBus from '../services/EventBus.js';
import Achievements from '../services/Achievements.js';
import { loadLevel } from '../services/LevelLoader.js';
import level1Data from '../data/level1.json';
import level2Data from '../data/level2.json';
import level3Data from '../data/level3.json';

const LEVELS = [null, level1Data, level2Data, level3Data];

const BONUS_LEVEL = {
  worldWidth: 400,
  worldHeight: 320,
  groundY: 288,
  playerStart: { x: 80, y: 272 },
  flag: null,
  ground: { tileWidth: 32, from: 0, to: 14 },
  platforms: [],
  pipes: [{ x: 320, y: 256, warp: { return: true } }],
  coins: [[120, 240], [200, 200], [280, 240], [200, 160]],
  enemies: [],
  waterZones: [],
};

function createPlaceholderTexture(scene, key, color, width = 32, height = 32) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(color);
  g.fillRoundedRect(0, 0, width, height, 4);
  g.lineStyle(1, 0x000000, 0.2);
  g.strokeRoundedRect(0, 0, width, height, 4);
  g.generateTexture(key, width, height);
  g.destroy();
}

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init(data) {
    this.levelIndex = (data && data.level) || 1;
    const save = SaveManager.load();
    this.difficulty = save.difficulty || 'normal';
    this.lives = (data && data.lives != null) ? data.lives : (save.lives ?? DEFAULT_LIVES);
    this.checkpointX = 80;
    this.checkpointY = 0;
    this.paused = false;
    this.levelStartTime = 0;
    this.flagReached = false;
    this.comboCount = 0;
    this.lastCoinTime = 0;
    this.comboWindow = 500;
    this.pipeWarping = false;
    this.enemySpeedMult = this.difficulty === 'easy' ? 0.8 : 1;
    this.waterBreathRemaining = WATER_BREATH_SECONDS;
    this.lowTimeWarned = false;
    this.readyScreenDone = false;
    this.levelTimeLimit = this.difficulty === 'easy' ? LEVEL_TIME_LIMIT_EASY : LEVEL_TIME_LIMIT;
  }

  create() {
    AudioManager.init(this);
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    createPlaceholderTexture(this, 'player_placeholder', 0xff3333, 32, 48);
    createPlaceholderTexture(this, 'coin_placeholder', 0xffdd00, 24, 24);
    createPlaceholderTexture(this, 'pipe_placeholder', 0x22aa22, 64, 128);
    createPlaceholderTexture(this, 'block_placeholder', 0x8b4513, 32, 32);
    createPlaceholderTexture(this, 'flagpole_placeholder', 0x228822, 16, 200);
    createPlaceholderTexture(this, 'ground_placeholder', 0x444444, 32, 32);
    createPlaceholderTexture(this, 'enemy_placeholder', 0x8b0000, 32, 32);
    createPlaceholderTexture(this, 'mushroom_placeholder', 0xdd2222, 28, 28);
    createPlaceholderTexture(this, 'star_placeholder', 0xffdd00, 24, 24);
    createPlaceholderTexture(this, 'brick_placeholder', 0xb22222, 32, 32);
    createPlaceholderTexture(this, 'question_placeholder', 0xd4a84b, 32, 32);
    createPlaceholderTexture(this, 'fire_placeholder', 0xff6600, 28, 28);

    this.ground = this.add.group();
    this.pipes = this.add.group();
    this.coinPool = [];
    this.coins = this.add.group();
    this.touchLeft = false;
    this.touchRight = false;
    this.touchJump = false;
    this.touchSprint = false;
    this.touchDown = false;
    this.touchDash = false;
    this.touchFire = false;
    this.enemies = this.add.group();
    this.fireballs = this.add.group();
    this.trailSprites = [];
    this.returnWarp = null;

    let levelData = LEVELS[this.levelIndex] || level1Data;
    if (this.levelIndex === 0 || data.bonus) {
      levelData = BONUS_LEVEL;
      this.returnWarp = data.returnWarp || null;
    }
    const result = loadLevel(this, levelData);
    const worldWidth = this.worldWidth;
    const worldHeight = this.worldHeight;
    const groundY = this.groundY;

    this.parallaxContainer = this.add.container(0, 0).setDepth(DEPTH.BACKGROUND);
    const sky = this.add.graphics().setScrollFactor(0);
    sky.fillStyle(0x87ceeb, 1);
    sky.fillRect(0, 0, worldWidth * 2, worldHeight * 2);
    sky.fillStyle(0x5ba3d0, 0.55);
    sky.fillRect(0, worldHeight * 0.5, worldWidth * 2, worldHeight * 2);
    this.parallaxContainer.add(sky);
    const clouds = this.add.graphics().setScrollFactor(0.12);
    for (let i = 0; i < 12; i++) {
      clouds.fillStyle(0xffffff, 0.25 + (i % 3) * 0.1);
      clouds.fillEllipse(200 + i * 180, 80 + (i % 5) * 60, 120 + (i % 4) * 30, 40);
    }
    this.parallaxContainer.add(clouds);
    const hillsFar = this.add.graphics().setScrollFactor(0.25);
    hillsFar.fillStyle(0x2d5a3d, 0.6);
    for (let i = 0; i <= worldWidth / 200 + 2; i++) {
      const x = i * 200;
      hillsFar.fillTriangle(x, worldHeight, x + 180, worldHeight, x + 90, worldHeight - 120);
    }
    this.parallaxContainer.add(hillsFar);
    const hillsNear = this.add.graphics().setScrollFactor(0.5);
    hillsNear.fillStyle(0x3d7a4d, 0.75);
    for (let i = 0; i <= worldWidth / 150 + 2; i++) {
      const x = i * 150;
      hillsNear.fillTriangle(x, worldHeight, x + 140, worldHeight, x + 70, worldHeight - 80);
    }
    this.parallaxContainer.add(hillsNear);
    const bg = this.add.graphics().setScrollFactor(1);
    bg.fillStyle(0x87ceeb, 0.4);
    bg.fillRect(0, 0, worldWidth * 2, worldHeight * 2);
    this.parallaxContainer.add(bg);

    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

    const ps = result.playerStart;
    this.checkpointX = ps.x;
    this.checkpointY = ps.y;
    this.ground.setDepth(DEPTH.TILES);
    if (this.movingPlatforms) this.movingPlatforms.setDepth(DEPTH.TILES);
    if (this.bricks) this.bricks.setDepth(DEPTH.TILES);
    if (this.questionBlocks) this.questionBlocks.setDepth(DEPTH.TILES);
    if (this.hiddenBlocks) this.hiddenBlocks.setDepth(DEPTH.TILES);
    if (this.hazards) this.hazards.setDepth(DEPTH.TILES);
    this.pipes.setDepth(DEPTH.TILES);
    this.coins.setDepth(DEPTH.PICKUPS);
    if (this.powerups) this.powerups.setDepth(DEPTH.PICKUPS);
    this.enemies.setDepth(DEPTH.ENEMIES);
    this.checkpointMarker = this.add.rectangle(this.checkpointX, this.checkpointY - 20, 12, 20, 0x22aa22).setDepth(DEPTH.TILES - 1);
    this.player = new Player(this, ps.x, ps.y);
    this.player.setDepth(DEPTH.PLAYER);
    this.playerWasOnGround = true;

    this.cursors = this.input.keyboard.createCursorKeys();
    const keyMap = (SaveManager.load().keyBindings || {});
    const k = (def, key) => Phaser.Input.Keyboard.KeyCodes[keyMap[key] || def];
    this.keys = {
      left: this.input.keyboard.addKey(k('A', 'left')),
      right: this.input.keyboard.addKey(k('D', 'right')),
      jump: this.input.keyboard.addKey(k('SPACE', 'jump')),
      down: this.input.keyboard.addKey(k('S', 'down')),
      sprint: this.input.keyboard.addKey(k('SHIFT', 'sprint')),
      esc: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC),
      dash: this.input.keyboard.addKey(k('X', 'dash')),
      fire: this.input.keyboard.addKey(k('C', 'fire')),
    };

    this.physics.add.collider(this.player, this.ground, () => {
      if (!this.playerWasOnGround && this.player.body.blocked.down) this.player.onLand();
      this.playerWasOnGround = this.player.body.blocked.down;
    });
    this.physics.add.collider(this.player, this.pipes);
    if (this.movingPlatforms && this.movingPlatforms.getLength()) {
      this.physics.add.collider(this.player, this.movingPlatforms);
      this.physics.add.collider(this.enemies, this.movingPlatforms);
    }
    this.physics.add.collider(this.enemies, this.ground);
    this.physics.add.collider(this.enemies, this.pipes);
    this.physics.add.overlap(this.player, this.coins, (p, c) => this.collectCoin(p, c), null, this);
    if (this.flagZone) this.physics.add.overlap(this.player, this.flagZone, () => this.reachFlagpole(), null, this);
    this.physics.add.overlap(this.player, this.enemies, (p, e) => this.playerEnemyOverlap(p, e), null, this);
    this.physics.add.overlap(this.player, this.pipes, (p, pipe) => this.tryPipeWarp(p, pipe), null, this);
    if (this.bricks && this.bricks.getLength()) {
      this.physics.add.collider(this.player, this.bricks, (p, b) => this.hitBrick(p, b), null, this);
    }
    if (this.questionBlocks && this.questionBlocks.getLength()) {
      this.physics.add.collider(this.player, this.questionBlocks, (p, q) => this.hitQuestionBlock(p, q), null, this);
    }
    if (this.hiddenBlocks && this.hiddenBlocks.getLength()) {
      this.physics.add.collider(this.player, this.hiddenBlocks, (p, h) => this.hitHiddenBlock(p, h), null, this);
    }
    if (this.hazards && this.hazards.getLength()) {
      this.physics.add.overlap(this.player, this.hazards, () => this.killPlayer(), null, this);
    }
    if (this.powerups) {
      this.physics.add.collider(this.powerups, this.ground);
      this.physics.add.collider(this.powerups, this.pipes);
      this.physics.add.overlap(this.player, this.powerups, (p, pow) => this.collectPowerup(p, pow), null, this);
    }
    this.physics.add.collider(this.fireballs, this.ground, (fb) => { fb.destroy(); this.fireballs.remove(fb); }, null, this);
    this.physics.add.collider(this.fireballs, this.pipes, (fb) => { fb.destroy(); this.fireballs.remove(fb); }, null, this);
    this.physics.add.overlap(this.fireballs, this.enemies, (fb, e) => {
      if (this.enemies.contains(e)) { e.destroy(); this.enemies.remove(e); fb.destroy(); this.fireballs.remove(fb); this.score += 200; if (this.scoreText) this.scoreText.setText('Score: ' + this.score); }
    }, null, this);

    this.createWaterVisuals();

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setDeadzone(80, 60);

    this.coinsCollected = 0;
    this.score = 0;
    this.levelStartTime = this.time.now;
    this.dustTimer = 0;
    this.waterBreathRemaining = WATER_BREATH_SECONDS;
    this.lowTimeLastSec = 61;
    this.checkpointMarker = null;
    this.vignette = null;
    this.createFloatingUI();
    this.showWorldTitle();
    this.events.on('ground-pound-land', () => this.onGroundPoundLand(), this);
    this.createTouchOverlay();
    this.createParticles();
    this.createWaterVisuals();
    this.fireCooldownUntil = 0;
    this.trailTimer = 0;
    this.cameras.main.setFollowOffset(CAMERA_LEAD_X, 0);
    this.cameras.main.fadeIn(FADE_DURATION);
    this.showReadyScreen();
  }

  createWaterVisuals() {
    this.waterVisuals = [];
    if (!this.waterZones || !this.waterZones.getLength()) return;
    this.waterZones.getChildren().forEach((zone) => {
      const g = this.add.graphics().setDepth(DEPTH.TILES - 2);
      g.fillStyle(0x3366aa, 0.5);
      g.fillRect(zone.x - zone.width / 2, zone.y - zone.height / 2, zone.width, zone.height);
      this.waterVisuals.push({ g, zone, phase: Math.random() * Math.PI * 2 });
    });
  }

  showReadyScreen() {
    const cx = this.cameras.main.width / 2;
    const cy = this.cameras.main.height / 2;
    const ready = this.add.text(cx, cy, 'Get Ready!', { fontSize: '32px', color: '#fff', fontFamily: 'Arial' }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(DEPTH.UI + 5);
    this.time.delayedCall(READY_SCREEN_DURATION, () => {
      ready.destroy();
      this.readyScreenDone = true;
    });
  }

  createParticles() {
    if (AudioManager.isReducedMotion()) return;
    this.particles = {};
    const dust = this.add.particles(0, 0, 'coin_placeholder', {
      x: 0, y: 0,
      lifespan: 400,
      speed: { min: 20, max: 60 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.6, end: 0 },
      frequency: -1,
      tint: 0x8b7355,
    });
    dust.setDepth(DEPTH.TILES + 1);
    this.particles.dust = dust;

    const coin = this.add.particles(0, 0, 'coin_placeholder', {
      lifespan: 350,
      speed: { min: 40, max: 100 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 1, end: 0 },
      frequency: -1,
      quantity: 6,
      tint: 0xffdd00,
    });
    coin.setDepth(DEPTH.PICKUPS + 1);
    this.particles.coin = coin;

    const stomp = this.add.particles(0, 0, 'coin_placeholder', {
      lifespan: 300,
      speed: { min: 80, max: 150 },
      scale: { start: 0.35, end: 0 },
      alpha: { start: 0.9, end: 0 },
      frequency: -1,
      quantity: 8,
      tint: 0x8b0000,
    });
    stomp.setDepth(DEPTH.ENEMIES + 1);
    this.particles.stomp = stomp;

    const death = this.add.particles(0, 0, 'coin_placeholder', {
      lifespan: 600,
      speed: { min: 100, max: 220 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 1, end: 0 },
      frequency: -1,
      quantity: 12,
      tint: 0xff3333,
    });
    death.setDepth(DEPTH.PLAYER + 1);
    this.particles.death = death;

    const brick = this.add.particles(0, 0, 'coin_placeholder', {
      lifespan: 500,
      speed: { min: 60, max: 140 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.9, end: 0 },
      frequency: -1,
      quantity: 6,
      tint: 0xb22222,
    });
    brick.setDepth(DEPTH.TILES + 1);
    this.particles.brick = brick;
  }

  createTouchOverlay() {
    const isTouch = this.sys.game.device.input.touch;
    if (!isTouch) return;
    const container = this.add.container(0, 0).setScrollFactor(0).setDepth(DEPTH.UI + 10);
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    const zone = (x, y, ww, hh, setKey) => {
      const g = this.add.zone(x, y, ww, hh).setOrigin(0, 0).setInteractive({ useHandCursor: false });
      g.on('pointerdown', () => { setKey(true); });
      g.on('pointerup', () => { setKey(false); });
      g.on('pointerout', () => { setKey(false); });
      container.add(g);
      const bg = this.add.graphics();
      bg.fillStyle(0xffffff, 0.2);
      bg.fillRoundedRect(x, y, ww, hh, 8);
      container.add(bg);
    };
    const btn = 56;
    const padX = 24;
    const padY = h - 120;
    zone(padX, padY + btn, btn, btn, (v) => { this.touchLeft = v; });
    zone(padX + btn + 8, padY + btn, btn, btn, (v) => { this.touchRight = v; });
    const jumpX = w - padX - btn * 2 - 16;
    const jumpY = h - 140;
    zone(jumpX, jumpY, btn * 2 + 8, btn, (v) => { this.touchJump = v; });
    zone(jumpX + btn * 2 + 24, jumpY + btn + 8, btn, btn, (v) => { this.touchSprint = v; });
    zone(jumpX, jumpY + btn + 8, btn, btn, (v) => { this.touchDown = v; });
    zone(jumpX + btn + 8, jumpY + btn + 8, btn, btn, (v) => { this.touchDash = v; });
    zone(jumpX - btn - 8, jumpY + btn + 8, btn, btn, (v) => { this.touchFire = v; });
    this.touchOverlay = container;
  }

  getTime() {
    if (!this.levelStartTime) return this.levelTimeLimit || LEVEL_TIME_LIMIT;
    return Math.max(0, this.levelTimeLimit - (this.time.now - this.levelStartTime) / 1000);
  }

  createFloatingUI() {
    const ui = this.add.container(0, 0).setScrollFactor(0).setDepth(DEPTH.UI);
    const panelX = 20, panelY = 20, panelW = 240, panelH = 76;
    const bg = this.add.graphics();
    bg.fillStyle(0x1e1e2e, 0.92);
    bg.fillRoundedRect(panelX, panelY, panelW, panelH, 14);
    bg.lineStyle(2, 0x444466, 0.8);
    bg.strokeRoundedRect(panelX, panelY, panelW, panelH, 14);
    ui.add(bg);
    this.livesText = this.add.text(panelX + 14, panelY + 10, 'Lives: ' + this.lives, { fontSize: '15px', color: '#fff', fontFamily: 'Arial' }).setOrigin(0, 0);
    ui.add(this.livesText);
    this.timerText = this.add.text(panelX + 14, panelY + 28, 'Time: ' + Math.floor(this.getTime()), { fontSize: '15px', color: '#ffdd00', fontFamily: 'Arial' }).setOrigin(0, 0);
    ui.add(this.timerText);
    this.coinText = this.add.text(panelX + 14, panelY + 46, '× ' + this.coinsCollected, { fontSize: '18px', color: '#fff', fontFamily: 'Arial' }).setOrigin(0, 0);
    ui.add(this.coinText);
    this.scoreText = this.add.text(panelX + 125, panelY + 46, 'Score: ' + this.score, { fontSize: '15px', color: '#aaa', fontFamily: 'Arial' }).setOrigin(0, 0);
    ui.add(this.scoreText);
    const version = this.add.text(panelX + panelW - 8, panelY + panelH - 6, 'v2', { fontSize: '11px', color: '#666', fontFamily: 'Arial' }).setOrigin(1, 1);
    ui.add(version);
    this.uiContainer = ui;
  }

  showWorldTitle() {
    const t = this.add.text(400, 200, 'World 1-' + this.levelIndex, { fontSize: '36px', color: '#fff', fontFamily: 'Arial' }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(DEPTH.UI + 1);
    this.tweens.add({ targets: t, alpha: 0, duration: 1500, delay: 800, onComplete: () => t.destroy() });
  }

  collectCoin(player, coin) {
    const now = this.time.now;
    if (now - this.lastCoinTime < this.comboWindow) this.comboCount++;
    else this.comboCount = 1;
    this.lastCoinTime = now;
    const points = 100 * this.comboCount;
    this.score += points;
    this.coinsCollected++;
    this.coinText.setText('× ' + this.coinsCollected);
    this.scoreText.setText('Score: ' + this.score);
    AudioManager.playCoin();
    if (this.particles && this.particles.coin) {
      this.particles.coin.setPosition(coin.x, coin.y);
      this.particles.coin.explode(6);
    }
    if (!AudioManager.isReducedMotion()) {
      this.tweens.add({ targets: coin, scaleX: 1.5, scaleY: 1.5, duration: 80, yoyo: true, onComplete: () => this.releaseCoinToPool(coin) });
    } else {
      this.releaseCoinToPool(coin);
    }
    Achievements.tryUnlock(Achievements.ACHIEVEMENT_IDS.FIRST_COIN);
    if (this.comboCount >= 3) Achievements.tryUnlock(Achievements.ACHIEVEMENT_IDS.COMBO_3);
    EventBus.emit(EVENTS.COIN_COLLECTED, points);
  }

  getCoinFromPool(x, y) {
    let coin = this.coinPool.pop();
    if (!coin) {
      coin = this.add.image(0, 0, 'coin_placeholder').setOrigin(0.5, 0.5);
      this.physics.add.existing(coin, true);
      coin.setTint(0xffdd00);
    }
    coin.setPosition(x, y);
    coin.setVisible(true);
    coin.setActive(true);
    if (coin.body) coin.body.enable = true;
    return coin;
  }

  releaseCoinToPool(coin) {
    this.coins.remove(coin);
    coin.setVisible(false);
    coin.setActive(false);
    if (coin.body) coin.body.enable = false;
    this.coinPool.push(coin);
  }

  collectPowerup(player, powerup) {
    if (!this.powerups.contains(powerup)) return;
    const ptype = powerup.getData('type');
    this.powerups.remove(powerup);
    powerup.destroy();
    if (ptype === 'star') {
      player.invincibleUntil = this.time.now + INVINCIBILITY_DURATION_MS;
      return;
    }
    if (ptype === '1up') {
      this.lives++;
      if (this.livesText) this.livesText.setText('Lives: ' + this.lives);
      const save = SaveManager.load();
      save.lives = this.lives;
      SaveManager.save(save);
      AudioManager.playOneUp();
      return;
    }
    if (ptype === 'fire') {
      player.firePower = true;
      return;
    }
    Achievements.tryUnlock(Achievements.ACHIEVEMENT_IDS.BIG_MUSHROOM);
    player.big = true;
    player.setScale(1.2);
    if (player.body) {
      player.body.setSize(player.displayWidth * 0.6, player.displayHeight * 0.9);
    }
  }

  hitBrick(player, brick) {
    if (!this.bricks.contains(brick)) return;
    const fromBelow = player.body.velocity.y < 0 && player.y + player.displayHeight * 0.5 < brick.y - 4;
    const fromAbove = player.body.velocity.y > 0 && player.y < brick.y;
    const canBreak = player.big || player.groundPoundActive;
    if (fromAbove && canBreak) {
      this.bricks.remove(brick);
      if (this.particles && this.particles.brick) {
        this.particles.brick.setPosition(brick.x, brick.y);
        this.particles.brick.explode(6);
      }
      brick.destroy();
      this.score += BRICK_SCORE;
      if (this.scoreText) this.scoreText.setText('Score: ' + this.score);
      AudioManager.playBrick();
      EventBus.emit(EVENTS.BRICK_BROKEN);
    } else if (fromBelow && !canBreak) {
      player.setVelocityY(QUESTION_BOUNCE_VELOCITY);
    }
  }

  hitHiddenBlock(player, block) {
    if (!this.hiddenBlocks || !this.hiddenBlocks.contains(block) || !block.getData('hidden')) return;
    const fromBelow = player.body.velocity.y < 0 && player.y + player.displayHeight * 0.5 < block.y - 4;
    if (!fromBelow) return;
    block.setData('hidden', false);
    block.setAlpha(1);
    player.setVelocityY(QUESTION_BOUNCE_VELOCITY);
    const content = block.getData('content') || 'coin';
    if (content === 'coin') {
      const coin = this.getCoinFromPool(block.x, block.y - 20);
      this.coins.add(coin);
      this.tweens.add({ targets: coin, y: block.y - 68, duration: 300, ease: 'Quad.easeOut', onComplete: () => {
        this.coins.remove(coin);
        this.score += 100;
        this.coinsCollected++;
        if (this.coinText) this.coinText.setText('× ' + this.coinsCollected);
        if (this.scoreText) this.scoreText.setText('Score: ' + this.score);
        AudioManager.playCoin();
        this.releaseCoinToPool(coin);
      } });
    } else {
      this.time.delayedCall(80, () => this.spawnPowerupFromBlock(block.x, block.y - 24, content));
    }
  }

  hitQuestionBlock(player, block) {
    if (!this.questionBlocks.contains(block) || block.getData('used')) return;
    const fromBelow = player.body.velocity.y < 0 && player.y + player.displayHeight * 0.5 < block.y - 4;
    if (!fromBelow) return;
    block.setData('used', true);
    block.setTexture('brick_placeholder');
    player.setVelocityY(QUESTION_BOUNCE_VELOCITY);
    AudioManager.playQuestion();
    EventBus.emit(EVENTS.QUESTION_HIT);
    this.tweens.add({ targets: block, y: block.y - 12, duration: 80, yoyo: true, ease: 'Quad.easeOut' });
    const content = block.getData('content') || 'coin';
    this.time.delayedCall(100, () => this.spawnPowerupFromBlock(block.x, block.y - 24, content));
  }

  spawnPowerupFromBlock(x, y, content) {
    if (content === 'coin') {
      const coin = this.getCoinFromPool(x, y);
      this.coins.add(coin);
      this.tweens.add({
        targets: coin,
        y: y - 48,
        duration: 300,
        ease: 'Quad.easeOut',
        onComplete: () => {
          this.coins.remove(coin);
          this.score += 100;
          this.coinsCollected++;
          if (this.coinText) this.coinText.setText('× ' + this.coinsCollected);
          if (this.scoreText) this.scoreText.setText('Score: ' + this.score);
          AudioManager.playCoin();
          if (this.particles && this.particles.coin) {
            this.particles.coin.setPosition(coin.x, coin.y);
            this.particles.coin.explode(6);
          }
          this.releaseCoinToPool(coin);
        },
      });
      return;
    }
    const key = content === 'star' ? 'star_placeholder' : content === '1up' ? 'mushroom_placeholder' : content === 'fire' ? 'fire_placeholder' : 'mushroom_placeholder';
    const pow = this.add.image(x, y, key).setOrigin(0.5, 0.5);
    if (content === '1up') pow.setTint(0x00ff00);
    if (content === 'fire') pow.setData('type', 'fire');
    this.physics.add.existing(pow, false);
    pow.body.setAllowGravity(true);
    pow.body.setVelocityY(-180);
    if (content === 'star') {
      pow.setData('type', 'star');
      pow.body.setVelocityX(40);
      pow.body.setSize(22, 22);
    } else if (content === '1up') {
      pow.setData('type', '1up');
      pow.body.setVelocityX(50);
      pow.body.setSize(24, 24);
    } else if (content === 'fire') {
      pow.setData('type', 'fire');
      pow.body.setVelocityX(45);
      pow.body.setSize(24, 24);
    } else {
      pow.body.setVelocityX(60);
      pow.body.setSize(24, 24);
    }
    this.powerups.add(pow);
  }

  playerEnemyOverlap(player, enemy) {
    if (!this.enemies.contains(enemy)) return;
    if (player.invincibleUntil > this.time.now) return;
    if (player.body.velocity.y > 0 && player.y < enemy.y - 12) {
      AudioManager.playStomp();
      if (this.particles && this.particles.stomp) {
        this.particles.stomp.setPosition(enemy.x, enemy.y);
        this.particles.stomp.explode(8);
      }
      Achievements.tryUnlock(Achievements.ACHIEVEMENT_IDS.FIRST_STOMP);
      enemy.destroy();
      this.enemies.remove(enemy);
      player.setVelocityY(-280);
      this.score += 200;
      this.scoreText.setText('Score: ' + this.score);
      EventBus.emit(EVENTS.COIN_COLLECTED, 200);
    } else {
      this.killPlayer();
    }
  }

  killPlayer() {
    if (this.player.state === 'level_clear') return;
    if (!AudioManager.isReducedMotion()) {
      this.cameras.main.flash(200, 255, 0, 0);
    }
    if (this.particles && this.particles.death) {
      this.particles.death.setPosition(this.player.x, this.player.y);
      this.particles.death.explode(12);
    }
    this.player.invincibleUntil = 0;
    AudioManager.playDeath();
    Achievements.tryUnlock(Achievements.ACHIEVEMENT_IDS.FIRST_DEATH);
    this.lives--;
    this.livesText.setText('Lives: ' + this.lives);
    const save = SaveManager.load();
    save.lives = this.lives;
    SaveManager.save(save);
    EventBus.emit(EVENTS.PLAYER_DIED);
    if (this.lives <= 0) {
      this.cameras.main.fadeOut(FADE_DURATION);
      this.time.delayedCall(FADE_DURATION, () => this.scene.start('MenuScene'));
      return;
    }
    this.player.setVelocity(0, 0);
    const doRespawn = () => {
      this.player.x = this.checkpointX;
      this.player.y = this.checkpointY;
      this.player.setVelocity(0, 0);
      this.player.state = 'idle';
      this.player.groundPoundActive = false;
      this.player.big = false;
      this.player.setScale(1);
      this.player.alpha = 1;
      if (this.player.body) this.player.body.setSize(28, 44);
      this.physics.resume();
    };
    if (AudioManager.isReducedMotion()) {
      doRespawn();
    } else {
      this.physics.pause();
      this.tweens.add({
        targets: this.player,
        scaleX: 0.3,
        scaleY: 0.3,
        alpha: 0,
        duration: DEATH_ANIM_DURATION * 0.5,
        ease: 'Quad.easeIn',
        onComplete: doRespawn,
      });
    }
  }

  tryPipeWarp(player, pipe) {
    const k = this.effectiveKeys || this.keys;
    if (this.pipeWarping || !(k.down && k.down.isDown)) return;
    const warp = pipe.getData('warp');
    if (!warp) return;
    this.pipeWarping = true;
    this.player.setVelocity(0, 0);
    this.tweens.add({
      targets: this.player,
      y: this.player.y + 48,
      duration: 400,
      ease: 'Linear',
      onComplete: () => {
        if (warp.return && this.returnWarp) {
          const r = this.returnWarp;
          this.returnWarp = null;
          this.levelIndex = r.level;
          loadLevel(this, LEVELS[r.level]);
          this.player.x = r.x;
          this.player.y = r.y;
          this.player.setVelocity(0, 0);
          this.checkpointX = r.x;
          this.checkpointY = r.y;
          if (this.checkpointMarker) { this.checkpointMarker.x = r.x; this.checkpointMarker.y = r.y - 20; }
          this.pipeWarping = false;
          return;
        }
        if (warp.bonus) {
          Achievements.tryUnlock(Achievements.ACHIEVEMENT_IDS.FIRST_WARP);
          AudioManager.playWarp();
          this.returnWarp = { level: this.levelIndex, x: this.player.x, y: this.player.y };
          const res = loadLevel(this, BONUS_LEVEL);
          this.player.x = res.playerStart.x;
          this.player.y = res.playerStart.y;
          this.player.setVelocity(0, 0);
          this.levelIndex = 0;
          this.levelTimeLimit = 60;
          this.levelStartTime = this.time.now;
          this.flagReached = false;
          this.flagX = null;
          this.flagpole = null;
          this.flagZone = null;
          if (this.checkpointMarker) { this.checkpointMarker.x = res.playerStart.x; this.checkpointMarker.y = res.playerStart.y - 20; }
          this.pipeWarping = false;
          return;
        }
        Achievements.tryUnlock(Achievements.ACHIEVEMENT_IDS.FIRST_WARP);
        AudioManager.playWarp();
        this.player.x = warp.x;
        this.player.y = warp.y;
        this.pipeWarping = false;
      },
    });
  }

  reachFlagpole() {
    if (this.flagReached || this.player.state === 'level_clear') return;
    this.flagReached = true;
    const poleTop = this.flagpole ? this.flagpole.y - 180 : this.groundY - 200;
    const heightRatio = Math.max(0, Math.min(1, (poleTop - this.player.y) / 180));
    const poleScore = FLAGPOLE_BASE_SCORE + Math.floor(heightRatio * 5) * FLAGPOLE_HEIGHT_BONUS;
    this.score += poleScore;
    if (this.scoreText) this.scoreText.setText('Score: ' + this.score);
    this.player.triggerLevelClear();
    this.physics.pause();
    const targetY = this.groundY - 16;
    this.tweens.add({
      targets: this.player,
      x: this.flagX + 20,
      y: targetY,
      duration: 600,
      ease: 'Linear',
      onComplete: () => this.showLevelClear(),
    });
  }

  showLevelClear() {
    AudioManager.playLevelClear();
    const timeLeft = Math.floor(this.getTime());
    const timeBonus = timeLeft * 10;
    this.score += timeBonus;
    SaveManager.setHighScore(this.score);
    const levelKey = 'level' + this.levelIndex;
    const elapsed = this.levelTimeLimit - this.getTime();
    SaveManager.setBestTime(levelKey, elapsed);
    SaveManager.setLevelCoins(levelKey, this.coinsCollected);
    SaveManager.setUnlockedLevel(this.levelIndex + 1);
    const save = SaveManager.load();
    save.lives = this.lives;
    SaveManager.save(save);
    if (this.levelIndex === 1) Achievements.tryUnlock(Achievements.ACHIEVEMENT_IDS.LEVEL_1_CLEAR);
    if (this.levelIndex === 2) Achievements.tryUnlock(Achievements.ACHIEVEMENT_IDS.LEVEL_2_CLEAR);
    if (this.levelIndex === 3) Achievements.tryUnlock(Achievements.ACHIEVEMENT_IDS.LEVEL_3_CLEAR);
    if (elapsed < 60) Achievements.tryUnlock(Achievements.ACHIEVEMENT_IDS.SPEEDRUN_60);
    const levelData = LEVELS[this.levelIndex];
    const totalCoins = (levelData && levelData.coins && levelData.coins.length) || 0;
    if (this.levelIndex === 1 && totalCoins > 0 && this.coinsCollected >= totalCoins) Achievements.tryUnlock(Achievements.ACHIEVEMENT_IDS.ALL_COINS_L1);
    if (!AudioManager.isReducedMotion()) {
      this.cameras.main.flash(300, 255, 255, 255);
    }
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;
    const panel = this.add.graphics().setScrollFactor(0).setDepth(DEPTH.UI + 2);
    panel.fillStyle(0x000000, 0.8);
    panel.fillRoundedRect(centerX - 160, centerY - 70, 320, 140, 12);
    const text = this.add.text(centerX, centerY - 35, 'LEVEL CLEAR!', { fontSize: '32px', color: '#fff', fontFamily: 'Arial' }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(DEPTH.UI + 3);
    const sub = this.add.text(centerX, centerY + 5, 'Score: ' + this.score + '  Time bonus: +' + timeBonus, { fontSize: '16px', color: '#aaa', fontFamily: 'Arial' }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(DEPTH.UI + 3);
    const sub2 = this.add.text(centerX, centerY + 35, 'Press SPACE or click to continue', { fontSize: '14px', color: '#888', fontFamily: 'Arial' }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(DEPTH.UI + 3);
    this.input.keyboard.once('keydown-SPACE', () => { this.cameras.main.fadeOut(FADE_DURATION); this.time.delayedCall(FADE_DURATION, () => this.scene.start('MenuScene')); });
    this.input.once('pointerdown', () => { this.cameras.main.fadeOut(FADE_DURATION); this.time.delayedCall(FADE_DURATION, () => this.scene.start('MenuScene')); });
    EventBus.emit(EVENTS.LEVEL_CLEAR, this.score);
  }

  onGroundPoundLand() {
    AudioManager.playStomp();
    Achievements.tryUnlock(Achievements.ACHIEVEMENT_IDS.GROUND_POUND);
    if (!AudioManager.isReducedMotion()) {
      this.cameras.main.shake(120, 0.008);
    }
  }

  togglePause() {
    this.paused = !this.paused;
    if (this.paused) {
      this.physics.pause();
      this.showPauseMenu();
    } else {
      this.physics.resume();
      this.hidePauseMenu();
    }
  }

  showPauseMenu() {
    const cx = this.cameras.main.width / 2;
    const cy = this.cameras.main.height / 2;
    this.pausePanel = this.add.graphics().setScrollFactor(0).setDepth(DEPTH.PAUSE_OVERLAY);
    this.pausePanel.fillStyle(0x000000, 0.7);
    this.pausePanel.fillRect(0, 0, 800, 480);
    const title = this.add.text(cx, cy - 60, 'PAUSED', { fontSize: '36px', color: '#fff', fontFamily: 'Arial' }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(DEPTH.PAUSE_OVERLAY + 1);
    const resume = this.add.text(cx, cy - 10, 'Resume (ESC)', { fontSize: '20px', color: '#fff', fontFamily: 'Arial' }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(DEPTH.PAUSE_OVERLAY + 1).setInteractive({ useHandCursor: true });
    resume.on('pointerdown', () => this.togglePause());
    const restart = this.add.text(cx, cy + 30, 'Restart', { fontSize: '20px', color: '#fff', fontFamily: 'Arial' }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(DEPTH.PAUSE_OVERLAY + 1).setInteractive({ useHandCursor: true });
    restart.on('pointerdown', () => {
      this.hidePauseMenu();
      this.player.big = false;
      this.player.invincibleUntil = 0;
      this.scene.restart({ level: this.levelIndex, lives: this.lives });
    });
    const quit = this.add.text(cx, cy + 70, 'Quit to Menu', { fontSize: '20px', color: '#fff', fontFamily: 'Arial' }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(DEPTH.PAUSE_OVERLAY + 1).setInteractive({ useHandCursor: true });
    quit.on('pointerdown', () => {
      this.hidePauseMenu();
      SaveManager.saveContinueState(this.levelIndex, this.lives);
      this.cameras.main.fadeOut(FADE_DURATION);
      this.time.delayedCall(FADE_DURATION, () => this.scene.start('MenuScene'));
    });
    this.pauseObjects = [this.pausePanel, title, resume, restart, quit];
  }

  hidePauseMenu() {
    this.physics.resume();
    if (this.pauseObjects) {
      this.pauseObjects.forEach((o) => o.destroy());
      this.pauseObjects = null;
    }
  }

  update(time, delta) {
    if (this.paused) return;
    if (this.flagReached) return;

    const timeLeft = this.getTime();
    if (this.timerText) this.timerText.setText('Time: ' + Math.floor(timeLeft));
    if (timeLeft <= 0) {
      this.killPlayer();
      return;
    }

    if (this.player.y > this.worldHeight + 80) {
      this.killPlayer();
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.esc)) {
      this.togglePause();
      return;
    }

    this.effectiveKeys = this.keys;
    const gamepad = this.input.gamepad.getPad(0);
    let keys = this.keys;
    if (gamepad && gamepad.connected) {
      const ax = gamepad.axes[0].getValue();
      const ay = gamepad.axes[1].getValue();
      keys = {
        left: { isDown: this.keys.left.isDown || ax < -0.5 },
        right: { isDown: this.keys.right.isDown || ax > 0.5 },
        jump: { isDown: this.keys.jump.isDown || gamepad.buttons[0].value > 0 },
        sprint: { isDown: this.keys.sprint.isDown || (gamepad.buttons[2] && gamepad.buttons[2].value > 0) },
        down: { isDown: this.keys.down.isDown || ay > 0.5 },
        esc: this.keys.esc,
        dash: { isDown: this.keys.dash.isDown || (gamepad.buttons[4] && gamepad.buttons[4].value > 0) },
        fire: { isDown: this.keys.fire && this.keys.fire.isDown },
      };
      this.effectiveKeys = keys;
    }
    if (this.touchLeft || this.touchRight || this.touchJump || this.touchSprint || this.touchDown || this.touchDash || this.touchFire) {
      const k = keys.left && typeof keys.left.isDown !== 'undefined' ? keys : this.keys;
      keys = {
        left: { isDown: (k.left && k.left.isDown) || this.touchLeft },
        right: { isDown: (k.right && k.right.isDown) || this.touchRight },
        jump: { isDown: (k.jump && k.jump.isDown) || this.touchJump },
        sprint: { isDown: (k.sprint && k.sprint.isDown) || this.touchSprint },
        down: { isDown: (k.down && k.down.isDown) || this.touchDown },
        esc: this.keys.esc,
        dash: { isDown: (k.dash && k.dash.isDown) || this.touchDash },
        fire: { isDown: (k.fire && k.fire.isDown) || this.touchFire },
      };
      this.effectiveKeys = keys;
    }

    if (this.player.firePower && keys.fire && Phaser.Input.Keyboard.JustDown(this.keys.fire) && this.time.now > this.fireCooldownUntil) {
      this.fireCooldownUntil = this.time.now + 400;
      const fb = new Fireball(this, this.player.x, this.player.y - 10, this.player.facingRight);
      this.fireballs.add(fb);
      fb.setDepth(DEPTH.PICKUPS);
    }

    if (!AudioManager.isReducedMotion() && (this.player.dashUntil > this.time.now / 1000 || Math.abs(this.player.body.velocity.x) > 320)) {
      this.trailTimer += delta;
      if (this.trailTimer > 50) {
        this.trailTimer = 0;
        const trail = this.add.image(this.player.x, this.player.y, 'player_placeholder').setTint(0xff3333).setAlpha(0.4).setDepth(DEPTH.PLAYER - 1);
        trail.setFlipX(this.player.flipX);
        this.tweens.add({ targets: trail, alpha: 0, duration: 200, onComplete: () => trail.destroy() });
      }
    } else this.trailTimer = 0;

    if (this.waterVisuals && this.waterVisuals.length) {
      this.waterVisuals.forEach((v) => {
        v.phase += 0.02;
        v.g.clear();
        v.g.fillStyle(0x3366aa, 0.4 + Math.sin(v.phase) * 0.1);
        v.g.fillRect(v.zone.x - v.zone.width / 2, v.zone.y - v.zone.height / 2 + Math.sin(v.phase * 1.5) * 3, v.zone.width, v.zone.height);
      });
    }

    this.player.inWater = false;
    this.physics.overlap(this.player, this.waterZones, () => { this.player.inWater = true; }, null, this);
    if (this.player.inWater) {
      this.waterBreathRemaining -= delta / 1000;
      if (this.waterBreathRemaining <= 0) this.killPlayer();
    } else {
      this.waterBreathRemaining = Math.min(WATER_BREATH_SECONDS, this.waterBreathRemaining + delta / 500);
    }

    const timeLeft = this.getTime();
    if (timeLeft > 0 && timeLeft <= LOW_TIME_WARNING_SECONDS) {
      const sec = Math.floor(timeLeft);
      if (sec !== this.lowTimeLastSec) {
        this.lowTimeLastSec = sec;
        AudioManager.playLowTime();
      }
      if (!this.vignette && !AudioManager.isReducedMotion()) {
        this.vignette = this.add.graphics().setScrollFactor(0).setDepth(DEPTH.UI - 1);
        this.vignette.fillStyle(0x000000, 0.35);
        this.vignette.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
        this.vignette.setAlpha(0);
        this.tweens.add({ targets: this.vignette, alpha: 1, duration: 500 });
      }
    } else {
      this.lowTimeLastSec = 61;
      if (this.vignette) {
        this.tweens.add({ targets: this.vignette, alpha: 0, duration: 300, onComplete: () => { if (this.vignette) this.vignette.destroy(); this.vignette = null; } });
      }
    }

    const leadX = this.player.facingRight ? CAMERA_LEAD_X : -CAMERA_LEAD_X;
    this.cameras.main.setFollowOffset(leadX, 0);

    const prevCheck = this.checkpointX;
    if (this.player.body.velocity.y > 0 && this.player.y > this.groundY - 20) {
      const checkX = this.player.x;
      if (checkX > this.checkpointX && checkX < this.flagX - 100) {
        this.checkpointX = Math.floor(checkX / 160) * 160;
        this.checkpointY = this.groundY - 16;
      }
    }
    if (this.checkpointX !== prevCheck && this.checkpointMarker) {
      this.checkpointMarker.x = this.checkpointX;
      this.checkpointMarker.y = this.checkpointY - 20;
    }

    this.playerWasOnGround = this.player.body.blocked.down || this.player.body.touching.down;
    if (this.particles && this.particles.dust && this.player.body.blocked.down && Math.abs(this.player.body.velocity.x) > 40) {
      this.dustTimer += delta;
      if (this.dustTimer > 80) {
        this.dustTimer = 0;
        const dx = this.player.facingRight ? -14 : 14;
        this.particles.dust.setPosition(this.player.x + dx, this.player.y - 4);
        this.particles.dust.emit(1);
      }
    } else {
      this.dustTimer = 0;
    }
    this.coins.getChildren().forEach((coin) => {
      coin.rotation += 0.02;
      coin.y += Math.sin(time / 200 + coin.x) * 0.15;
    });
    this.enemies.getChildren().forEach((e) => e.update());
    if (this.powerups) {
      this.powerups.getChildren().forEach((m) => {
        if (m.body && (m.body.blocked.left || m.body.blocked.right)) m.body.setVelocityX(-m.body.velocity.x);
      });
    }
    if (!this.pipeWarping) this.player.update(keys, time, delta);
  }
}
