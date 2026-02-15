import Phaser from 'phaser';
import Enemy from '../entities/Enemy.js';
import FlyingEnemy from '../entities/FlyingEnemy.js';
import BouncingEnemy from '../entities/BouncingEnemy.js';

/**
 * Loads level from JSON and builds ground, platforms, pipes, coins, enemies, flag, water zones,
 * moving platforms, bricks, question blocks, stars.
 */
export function loadLevel(scene, levelData) {
  if (!levelData) return null;
  const worldWidth = levelData.worldWidth || 1600;
  const worldHeight = levelData.worldHeight || 480;
  const groundY = levelData.groundY || worldHeight - 32;

  scene.worldWidth = worldWidth;
  scene.worldHeight = worldHeight;
  scene.groundY = groundY;

  const ground = scene.ground;
  ground.clear(true, true);
  const tw = levelData.ground?.tileWidth || 32;
  const from = levelData.ground?.from ?? 0;
  const to = levelData.ground?.to ?? Math.ceil(worldWidth / tw) + 2;
  for (let i = from; i <= to; i++) {
    const x = i * tw;
    const b = scene.add.image(x, groundY + tw / 2, 'ground_placeholder').setOrigin(0.5, 0.5);
    scene.physics.add.existing(b, true);
    ground.add(b);
  }

  // Moving platforms
  if (!scene.movingPlatforms) scene.movingPlatforms = scene.add.group();
  scene.movingPlatforms.clear(true, true);
  (levelData.movingPlatforms || []).forEach((mp) => {
    const w = mp.width || 96;
    const h = mp.height || 16;
    const cx = mp.x + w / 2;
    const cy = mp.y + h / 2;
    const plat = scene.add.image(cx, cy, 'block_placeholder').setOrigin(0.5, 0.5).setDisplaySize(w, h);
    scene.physics.add.existing(plat, true);
    scene.movingPlatforms.add(plat);
    const dx = mp.moveX || 0;
    const dy = mp.moveY || -80;
    const dur = mp.duration || 2000;
    scene.tweens.add({
      targets: plat,
      x: cx + dx,
      y: cy + dy,
      duration: dur,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  });

  // Bricks (breakable)
  if (!scene.bricks) scene.bricks = scene.add.group();
  scene.bricks.clear(true, true);
  (levelData.bricks || []).forEach((pos) => {
    const x = Array.isArray(pos) ? pos[0] : pos.x;
    const y = Array.isArray(pos) ? pos[1] : pos.y;
    const b = scene.add.image(x + 16, y + 16, 'brick_placeholder').setOrigin(0.5, 0.5);
    scene.physics.add.existing(b, true);
    scene.bricks.add(b);
  });

  // Slopes (staircase of small blocks to approximate ramp)
  (levelData.slopes || []).forEach((slope) => {
    const len = slope.length || 64;
    const angleDeg = slope.angle ?? 45;
    const rad = (angleDeg * Math.PI) / 180;
    const step = 16;
    const dx = step * Math.cos(rad);
    const dy = -step * Math.sin(rad);
    let x = slope.x ?? 0;
    let y = slope.y ?? groundY;
    for (let i = 0; i < len / step; i++) {
      const b = scene.add.image(x + 8, y + 8, 'ground_placeholder').setOrigin(0.5, 0.5).setTint(0x555555);
      scene.physics.add.existing(b, true);
      ground.add(b);
      x += dx;
      y += dy;
    }
  });

  // Hidden blocks (invisible until hit from below)
  if (!scene.hiddenBlocks) scene.hiddenBlocks = scene.add.group();
  scene.hiddenBlocks.clear(true, true);
  (levelData.hiddenBlocks || []).forEach((pos) => {
    const x = (Array.isArray(pos) ? pos[0] : pos.x) + 16;
    const y = (Array.isArray(pos) ? pos[1] : pos.y) + 16;
    const content = !Array.isArray(pos) && pos.content ? pos.content : 'coin';
    const block = scene.add.image(x, y, 'brick_placeholder').setOrigin(0.5, 0.5).setAlpha(0);
    scene.physics.add.existing(block, true);
    block.setData('hidden', true);
    block.setData('content', content);
    scene.hiddenBlocks.add(block);
  });

  // Moving hazards (kill on overlap)
  if (!scene.hazards) scene.hazards = scene.add.group();
  scene.hazards.clear(true, true);
  (levelData.hazards || []).forEach((h) => {
    const w = h.width || 32;
    const hh = h.height || 32;
    const startX = (h.x || 0) + w / 2;
    const startY = (h.y || 0) + hh / 2;
    const endX = startX + (h.moveX || 80);
    const endY = startY + (h.moveY || 0);
    const sprite = scene.add.image(startX, startY, 'brick_placeholder').setOrigin(0.5, 0.5).setTint(0x330000).setDisplaySize(w, hh);
    scene.physics.add.existing(sprite, true);
    scene.hazards.add(sprite);
    const duration = h.duration || 2000;
    scene.tweens.add({
      targets: sprite,
      x: endX,
      y: endY,
      duration,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  });

  // Question blocks (hit from below, spawn once)
  if (!scene.questionBlocks) scene.questionBlocks = scene.add.group();
  scene.questionBlocks.clear(true, true);
  (levelData.questionBlocks || []).forEach((qb) => {
    const x = (qb.x ?? 0) + 16;
    const y = (qb.y ?? 0) + 16;
    const block = scene.add.image(x, y, 'question_placeholder').setOrigin(0.5, 0.5);
    scene.physics.add.existing(block, true);
    block.setData('used', false);
    block.setData('content', qb.content || 'coin');
    scene.questionBlocks.add(block);
  });

  (levelData.platforms || []).forEach((p) => {
    const w = p.width || 32;
    const h = p.height || 32;
    if (p.vertical) {
      for (let y = p.y; y < p.y + h; y += 32) {
        const b = scene.add.image(p.x + 16, y + 16, 'block_placeholder').setOrigin(0.5, 0.5);
        scene.physics.add.existing(b, true);
        ground.add(b);
      }
    } else {
      for (let x = p.x; x < p.x + w; x += 32) {
        const b = scene.add.image(x + 16, p.y + 16, 'block_placeholder').setOrigin(0.5, 0.5);
        scene.physics.add.existing(b, true);
        ground.add(b);
      }
    }
  });

  const pipes = scene.pipes;
  pipes.clear(true, true);
  (levelData.pipes || []).forEach((pipe) => {
    const img = scene.add.image(pipe.x + 32, groundY, 'pipe_placeholder').setOrigin(0.5, 1);
    scene.physics.add.existing(img, true);
    img.setData('warp', pipe.warp || null);
    pipes.add(img);
  });

  const coins = scene.coins;
  if (scene.releaseCoinToPool) {
    coins.getChildren().slice().forEach((coin) => scene.releaseCoinToPool(coin));
    coins.clear(false, false);
  } else {
    coins.clear(true, true);
  }
  (levelData.coins || []).forEach((pos) => {
    const x = Array.isArray(pos) ? pos[0] : pos.x;
    const y = Array.isArray(pos) ? pos[1] : pos.y;
    const coin = scene.getCoinFromPool ? scene.getCoinFromPool(x, y) : (() => {
      const c = scene.add.image(x, y, 'coin_placeholder').setOrigin(0.5, 0.5);
      scene.physics.add.existing(c, true);
      c.setTint(0xffdd00);
      return c;
    })();
    coins.add(coin);
  });

  const enemies = scene.enemies;
  enemies.clear(true, true);
  const speedMult = scene.enemySpeedMult || 1;
  (levelData.enemies || []).forEach((e) => {
    if (e.type === 'flying') {
      const fly = new FlyingEnemy(scene, e.x, e.y ?? groundY - 80, (e.speed || 40) * speedMult, e.amplitude || 60);
      enemies.add(fly);
    } else if (e.type === 'bouncing') {
      const bounce = new BouncingEnemy(scene, e.x, e.y ?? groundY - 16, (e.speed || 50) * speedMult, e.bounceVelocity ?? -280);
      enemies.add(bounce);
    } else {
      const enemy = new Enemy(scene, e.x, e.y ?? groundY - 16, (e.speed || 55) * speedMult);
      enemies.add(enemy);
    }
  });

  if (!scene.powerups) scene.powerups = scene.add.group();
  scene.powerups.clear(true, true);
  (levelData.mushrooms || []).forEach((pos) => {
    const x = Array.isArray(pos) ? pos[0] : pos.x;
    const y = Array.isArray(pos) ? pos[1] : pos.y;
    const m = scene.add.image(x, y, 'mushroom_placeholder').setOrigin(0.5, 0.5);
    scene.physics.add.existing(m, false);
    if (m.body) {
      m.body.setAllowGravity(true);
      m.body.setVelocityX(60);
      m.body.setSize(24, 24);
    }
    scene.powerups.add(m);
  });
  (levelData.stars || []).forEach((pos) => {
    const x = Array.isArray(pos) ? pos[0] : pos.x;
    const y = Array.isArray(pos) ? pos[1] : pos.y;
    const s = scene.add.image(x, y, 'star_placeholder').setOrigin(0.5, 0.5);
    scene.physics.add.existing(s, false);
    if (s.body) {
      s.body.setAllowGravity(true);
      s.body.setVelocityX(40);
      s.body.setSize(22, 22);
    }
    s.setData('type', 'star');
    scene.powerups.add(s);
  });
  (levelData.flowers || []).forEach((pos) => {
    const x = Array.isArray(pos) ? pos[0] : pos.x;
    const y = Array.isArray(pos) ? pos[1] : pos.y;
    const f = scene.add.image(x, y, 'fire_placeholder').setOrigin(0.5, 0.5);
    scene.physics.add.existing(f, false);
    if (f.body) {
      f.body.setAllowGravity(true);
      f.body.setVelocityX(45);
      f.body.setSize(24, 24);
    }
    f.setData('type', 'fire');
    scene.powerups.add(f);
  });

  if (!scene.waterZones) scene.waterZones = scene.add.group();
  scene.waterZones.clear(true, true);
  (levelData.waterZones || []).forEach((w) => {
    const zone = scene.add.zone(w.x + w.width / 2, w.y + w.height / 2, w.width, w.height).setOrigin(0.5, 0.5);
    scene.physics.add.existing(zone, true);
    scene.waterZones.add(zone);
  });

  if (scene.flagpole) scene.flagpole.destroy();
  if (scene.flagZone) scene.flagZone.destroy();
  const flag = levelData.flag;
  if (flag) {
    scene.flagpole = scene.add.image(flag.x + 8, flag.y + 100, 'flagpole_placeholder').setOrigin(0.5, 1);
    scene.physics.add.existing(scene.flagpole, true);
    scene.flagZone = scene.add.zone(flag.x + 20, flag.y + 50, 40, 120).setOrigin(0.5, 0.5);
    scene.physics.add.existing(scene.flagZone, true);
    scene.flagX = flag.x + 20;
    if (scene.flagpole.setDepth) scene.flagpole.setDepth(20);
  } else {
    scene.flagpole = null;
    scene.flagZone = null;
    scene.flagX = null;
  }

  return {
    playerStart: levelData.playerStart || { x: 80, y: groundY - 16 },
    groundY,
    worldWidth,
    worldHeight,
  };
}

export default loadLevel;
