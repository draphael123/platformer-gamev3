import Phaser from 'phaser';
import Player from '../entities/Player.js';

/** Create a simple placeholder texture (colored rectangle). */
function createPlaceholderTexture(scene, key, color, width = 32, height = 32) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(color);
  g.fillRect(0, 0, width, height);
  g.generateTexture(key, width, height);
  g.destroy();
}

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // --- Placeholder textures: Red Mario, Yellow Coins, Green Pipes ---
    createPlaceholderTexture(this, 'player_placeholder', 0xff3333, 32, 48);
    createPlaceholderTexture(this, 'coin_placeholder', 0xffdd00, 24, 24);
    createPlaceholderTexture(this, 'pipe_placeholder', 0x22aa22, 64, 128);
    createPlaceholderTexture(this, 'block_placeholder', 0x8b4513, 32, 32);
    createPlaceholderTexture(this, 'flagpole_placeholder', 0x228822, 16, 200);
    createPlaceholderTexture(this, 'ground_placeholder', 0x444444, 32, 32);

    // --- Background (solid fill; gradient is WebGL-only and can break Canvas renderer) ---
    const bg = this.add.graphics();
    bg.fillStyle(0x87ceeb, 1);
    bg.fillRect(0, 0, width * 2, height * 2);

    // --- World bounds (wider for level) ---
    const worldWidth = 1600;
    const worldHeight = 480;
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

    // --- Ground and platforms ---
    this.ground = this.physics.add.staticGroup();
    const groundY = worldHeight - 32;
    for (let x = 0; x < worldWidth + 64; x += 32) {
      const b = this.add.image(x, groundY + 16, 'ground_placeholder').setOrigin(0.5, 0.5);
      this.physics.add.existing(b, true);
      this.ground.add(b);
    }
    // Raised platform
    const platformY = groundY - 80;
    for (let x = 320; x < 480; x += 32) {
      const b = this.add.image(x, platformY + 16, 'block_placeholder').setOrigin(0.5, 0.5);
      this.physics.add.existing(b, true);
      this.ground.add(b);
    }
    // Wall-jump walls
    for (let y = platformY; y <= groundY; y += 32) {
      const b = this.add.image(312, y + 16, 'block_placeholder').setOrigin(0.5, 0.5);
      this.physics.add.existing(b, true);
      this.ground.add(b);
    }
    for (let y = platformY; y <= groundY; y += 32) {
      const b = this.add.image(488, y + 16, 'block_placeholder').setOrigin(0.5, 0.5);
      this.physics.add.existing(b, true);
      this.ground.add(b);
    }

    // --- Pipes (visual only for now - green placeholders) ---
    this.pipes = this.add.group();
    const pipePositions = [
      { x: 200, y: groundY - 64 },
      { x: 550, y: groundY - 64 },
      { x: 900, y: groundY - 64 },
    ];
    pipePositions.forEach(({ x, y }) => {
      const pipe = this.add.image(x, y + 64, 'pipe_placeholder').setOrigin(0.5, 1);
      this.physics.add.existing(pipe, true);
      this.pipes.add(pipe);
    });

    // --- Coin bubbles (floating, rotating - yellow) ---
    this.coins = this.physics.add.group();
    const coinPositions = [
      { x: 150, y: groundY - 80 },
      { x: 250, y: groundY - 120 },
      { x: 400, y: platformY - 20 },
      { x: 600, y: groundY - 100 },
      { x: 700, y: groundY - 150 },
      { x: 800, y: groundY - 80 },
      { x: 1000, y: groundY - 100 },
      { x: 1200, y: groundY - 140 },
    ];
    coinPositions.forEach(({ x, y }) => {
      const coin = this.add.image(x, y, 'coin_placeholder').setOrigin(0.5, 0.5);
      this.physics.add.existing(coin, true);
      coin.setTint(0xffdd00);
      this.coins.add(coin);
    });

    // --- Flagpole at end ---
    const flagX = worldWidth - 80;
    const flagY = groundY - 100;
    this.flagpole = this.add.image(flagX, flagY + 100, 'flagpole_placeholder').setOrigin(0.5, 1);
    this.physics.add.existing(this.flagpole, true);
    const flagZone = this.add.zone(flagX, flagY + 50, 40, 120).setOrigin(0.5, 0.5);
    this.physics.add.existing(flagZone, true);

    // --- Player ---
    this.player = new Player(this, 80, groundY - 16);
    this.playerWasOnGround = true;

    // --- Input ---
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = {
      left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      jump: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      sprint: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
    };

    // --- Collisions ---
    this.physics.add.collider(this.player, this.ground, () => {
      if (!this.playerWasOnGround && this.player.body.blocked.down) {
        this.player.onLand();
      }
      this.playerWasOnGround = this.player.body.blocked.down;
    });
    this.physics.add.collider(this.player, this.pipes);
    this.physics.add.overlap(this.player, this.coins, (p, c) => this.collectCoin(p, c), null, this);
    this.physics.add.overlap(this.player, flagZone, () => this.reachFlagpole(), null, this);

    // --- Camera follow ---
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setDeadzone(80, 60);

    // --- Floating UI: gradient panel, coin counter, score ---
    this.coinsCollected = 0;
    this.score = 0;
    this.createFloatingUI();

    // --- Events ---
    this.events.on('ground-pound-land', () => this.onGroundPoundLand(), this);
  }

  createFloatingUI() {
    const cam = this.cameras.main;
    const ui = this.add.container(0, 0).setScrollFactor(0);

    const panelWidth = 180;
    const panelHeight = 56;
    const pad = 24;
    const panelX = 20;
    const panelY = 20;

    const bg = this.add.graphics();
    bg.fillStyle(0x2d2d44, 0.9);
    bg.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 12);
    bg.lineStyle(2, 0xffffff, 0.3);
    bg.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 12);
    ui.add(bg);

    const coinIcon = this.add.image(panelX + 36, panelY + panelHeight / 2, 'coin_placeholder')
      .setScale(0.9)
      .setTint(0xffdd00);
    ui.add(coinIcon);

    this.coinText = this.add.text(panelX + 58, panelY + panelHeight / 2 - 2, '× 0', {
      fontSize: '22px',
      color: '#fff',
      fontFamily: 'Arial',
    }).setOrigin(0, 0.5);
    ui.add(this.coinText);

    this.scoreText = this.add.text(panelX + 12, panelY + 8, 'Score: 0', {
      fontSize: '14px',
      color: '#aaa',
      fontFamily: 'Arial',
    }).setOrigin(0, 0);
    ui.add(this.scoreText);

    this.uiContainer = ui;
  }

  collectCoin(player, coin) {
    coin.destroy();
    this.coinsCollected++;
    this.score += 100;
    this.coinText.setText('× ' + this.coinsCollected);
    this.scoreText.setText('Score: ' + this.score);
  }

  reachFlagpole() {
    if (this.player.state === 'level_clear') return;
    this.player.triggerLevelClear();
    this.showLevelClear();
  }

  showLevelClear() {
    const cam = this.cameras.main;
    const centerX = cam.width / 2;
    const centerY = cam.height / 2;
    const panel = this.add.graphics();
    panel.fillStyle(0x000000, 0.75);
    panel.fillRoundedRect(centerX - 140, centerY - 50, 280, 100, 12);
    const text = this.add.text(centerX, centerY - 20, 'LEVEL CLEAR!', {
      fontSize: '32px',
      color: '#fff',
      fontFamily: 'Arial',
    }).setOrigin(0.5, 0.5);
    const sub = this.add.text(centerX, centerY + 18, 'Coins: ' + this.coinsCollected + '  Score: ' + this.score, {
      fontSize: '18px',
      color: '#aaa',
      fontFamily: 'Arial',
    }).setOrigin(0.5, 0.5);
    this.levelClearContainer = this.add.container(0, 0, [panel, text, sub]).setScrollFactor(0);
    this.levelClearContainer.setDepth(100);
  }

  onGroundPoundLand() {
    this.cameras.main.shake(120, 0.008);
  }

  update(time, delta) {
    this.playerWasOnGround = this.player.body.blocked.down || this.player.body.touching.down;

    // Rotate coin placeholders (floating coin effect)
    this.coins.getChildren().forEach((coin) => {
      coin.rotation += 0.02;
      coin.y += Math.sin(time / 200 + coin.x) * 0.15;
    });

    this.player.update(
      {
        left: this.keys.left,
        right: this.keys.right,
        jump: this.keys.jump,
        down: this.keys.down,
        sprint: this.keys.sprint,
      },
      time,
      delta
    );
  }
}
