import Phaser from 'phaser';
import SaveManager from '../services/SaveManager.js';
import { DEFAULT_LIVES, EASY_LIVES, FADE_DURATION } from '../constants.js';

const CENTER_X = 400;
const CENTER_Y = 280;

export default class WorldMapScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WorldMapScene' });
  }

  create() {
    this.cameras.main.fadeIn(FADE_DURATION);
    this.add.text(CENTER_X, 50, 'World Map', {
      fontSize: '36px',
      color: '#fff',
      fontFamily: 'Arial',
    }).setOrigin(0.5, 0);

    const data = SaveManager.load();
    const difficulty = data.difficulty || 'normal';
    const lives = difficulty === 'easy' ? EASY_LIVES : DEFAULT_LIVES;
    const unlocked = SaveManager.getUnlockedLevels() || [1];
    const go = (level) => {
      this.cameras.main.fadeOut(FADE_DURATION);
      this.time.delayedCall(FADE_DURATION, () => this.scene.start('GameScene', { level, lives }));
    };

    const nodes = [
      { level: 1, x: 220, y: 200, label: '1-1' },
      { level: 2, x: 400, y: 200, label: '1-2' },
      { level: 3, x: 580, y: 200, label: '1-3' },
    ];
    nodes.forEach((n) => {
      const isUnlocked = unlocked.includes(n.level);
      const best = data.bestTimes && data.bestTimes['level' + n.level];
      const coins = data.levelCoins && data.levelCoins['level' + n.level];
      const label = n.label + (best != null ? '\n' + Math.floor(best) + 's' : '') + (coins != null ? ' ★' + coins : '');
      const node = this.add.text(n.x, n.y, label, {
        fontSize: '22px',
        color: isUnlocked ? '#ffd700' : '#555',
        fontFamily: 'Arial',
        backgroundColor: '#2a2a44',
        padding: { x: 16, y: 10 },
        align: 'center',
      }).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: isUnlocked });
      if (isUnlocked) {
        node.on('pointerover', () => node.setColor('#fff'));
        node.on('pointerout', () => node.setColor('#ffd700'));
        node.on('pointerdown', () => go(n.level));
      }
    });

    this.add.text(CENTER_X, 360, 'Back', {
      fontSize: '20px',
      color: '#aaa',
      fontFamily: 'Arial',
    }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.cameras.main.fadeOut(FADE_DURATION);
        this.time.delayedCall(FADE_DURATION, () => this.scene.start('MenuScene'));
      });

    this.input.keyboard.once('keydown-ESC', () => {
      this.cameras.main.fadeOut(FADE_DURATION);
      this.time.delayedCall(FADE_DURATION, () => this.scene.start('MenuScene'));
    });
  }
}
