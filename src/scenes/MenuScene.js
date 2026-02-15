import Phaser from 'phaser';
import SaveManager from '../services/SaveManager.js';
import Achievements from '../services/Achievements.js';
import { DEFAULT_LIVES, EASY_LIVES, FADE_DURATION } from '../constants.js';

const CENTER_X = 400;
const LINE = 28;

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    this.cameras.main.fadeIn(FADE_DURATION);
    const data = SaveManager.load();
    const scale = data.uiScale || 1;
    this.add.text(CENTER_X, 60, 'Platformer V3', {
      fontSize: (42 * scale) + 'px',
      color: '#fff',
      fontFamily: 'Arial',
    }).setOrigin(0.5, 0);

    this.add.text(CENTER_X, 115, 'New Super Mario Bros Style', {
      fontSize: (18 * scale) + 'px',
      color: '#aaa',
      fontFamily: 'Arial',
    }).setOrigin(0.5, 0);

    this.add.text(CENTER_X, 170, 'High Score: ' + (data.highScore || 0), {
      fontSize: (20 * scale) + 'px',
      color: '#ffd700',
      fontFamily: 'Arial',
    }).setOrigin(0.5, 0);

    const lives = (data.difficulty === 'easy' ? EASY_LIVES : DEFAULT_LIVES);
    let startY = 230;
    const go = (scene, data) => {
      this.cameras.main.fadeOut(FADE_DURATION);
      this.time.delayedCall(FADE_DURATION, () => this.scene.start(scene, data));
    };
    const cont = SaveManager.loadContinueState();
    if (cont && cont.lives > 0) {
      this._addButton(CENTER_X, startY, 'Continue (Level ' + cont.level + ')', () => { SaveManager.clearContinueState(); go('GameScene', { level: cont.level, lives: cont.lives }); });
      startY += LINE;
    }
    this._addButton(CENTER_X, startY, 'World Map', () => go('WorldMapScene'));
    this._addButton(CENTER_X, startY + LINE, 'Level 1', () => go('GameScene', { level: 1, lives }));
    this._addButton(CENTER_X, startY + LINE * 2, 'Level 2', () => go('GameScene', { level: 2, lives }));
    this._addButton(CENTER_X, startY + LINE * 3, 'Level 3', () => go('GameScene', { level: 3, lives }));
    this._addButton(CENTER_X, startY + LINE * 4, 'Difficulty: ' + (data.difficulty === 'easy' ? 'Easy' : 'Normal'), () => this._cycleDifficulty());
    this._addButton(CENTER_X, startY + LINE * 5, 'Achievements', () => this._showAchievements());
    this._addButton(CENTER_X, startY + LINE * 6, 'How to Play', () => this._showHowToPlay());
    this._addButton(CENTER_X, startY + LINE * 7, 'Options', () => this._openOptions());
    this._addButton(CENTER_X, startY + LINE * 8, 'Controls', () => this._openControls());
    this._addButton(CENTER_X, startY + LINE * 9, 'Remap Keys', () => this._showRemapKeys());
    this._addButton(CENTER_X, startY + LINE * 10, 'Credits', () => this._showCredits());
    this._addButton(CENTER_X, startY + LINE * 11, 'Fullscreen', () => this._toggleFullscreen());

    this.input.keyboard.once('keydown-SPACE', () => go('WorldMapScene'));
    this.input.keyboard.once('keydown-ONE', () => go('GameScene', { level: 1, lives }));
    this.input.keyboard.once('keydown-TWO', () => go('GameScene', { level: 2, lives }));
    this.input.keyboard.once('keydown-THREE', () => go('GameScene', { level: 3, lives }));
  }

  _addButton(x, y, text, callback) {
    const t = this.add.text(x, y, text, {
      fontSize: '24px',
      color: '#fff',
      fontFamily: 'Arial',
      backgroundColor: '#333',
      padding: { x: 12, y: 6 },
    }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
    t.on('pointerover', () => t.setColor('#ffd700'));
    t.on('pointerout', () => t.setColor('#fff'));
    t.on('pointerdown', callback);
  }

  _cycleDifficulty() {
    const data = SaveManager.load();
    data.difficulty = (data.difficulty === 'easy') ? 'normal' : 'easy';
    SaveManager.save(data);
    this.scene.restart();
  }

  _showAchievements() {
    const unlocked = Achievements.getUnlocked();
    const ids = Object.keys(Achievements.ACHIEVEMENT_IDS).map((k) => Achievements.ACHIEVEMENT_IDS[k]);
    const lines = ids.map((id) => (unlocked[id] ? '✓ ' : '○ ') + (Achievements.ACHIEVEMENT_TITLES[id] || id));
    const panel = this.add.graphics();
    panel.fillStyle(0x1a1a2e, 0.95);
    panel.fillRoundedRect(200, 120, 400, 320, 12);
    const title = this.add.text(CENTER_X, 140, 'Achievements', { fontSize: '22px', color: '#ffd700', fontFamily: 'Arial' }).setOrigin(0.5, 0);
    const body = this.add.text(CENTER_X, 180, lines.join('\n'), { fontSize: '16px', color: '#ccc', fontFamily: 'Arial' }).setOrigin(0.5, 0);
    const close = this.add.text(CENTER_X, 410, 'Close', { fontSize: '18px', color: '#fff', fontFamily: 'Arial' }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
    close.on('pointerdown', () => {
      panel.destroy();
      title.destroy();
      body.destroy();
      close.destroy();
    });
  }

  _showHowToPlay() {
    const lines = [
      'WASD or Arrows: Move',
      'SPACE: Jump (triple tap for triple jump)',
      'SHIFT: Sprint  X: Dash  C: Fire (when you have fire flower)',
      'S or Down: Duck / Pipe warp / Ground pound',
      'Some pipes lead to bonus rooms. Touch: on-screen buttons on mobile',
    ];
    const panel = this.add.graphics();
    panel.fillStyle(0x1a1a2e, 0.95);
    panel.fillRoundedRect(150, 80, 500, 340, 12);
    const title = this.add.text(CENTER_X, 100, 'How to Play', { fontSize: '22px', color: '#ffd700', fontFamily: 'Arial' }).setOrigin(0.5, 0);
    const body = this.add.text(CENTER_X, 150, lines.join('\n'), { fontSize: '16px', color: '#ccc', fontFamily: 'Arial' }).setOrigin(0.5, 0);
    const close = this.add.text(CENTER_X, 400, 'Close', { fontSize: '18px', color: '#fff', fontFamily: 'Arial' }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
    close.on('pointerdown', () => { panel.destroy(); title.destroy(); body.destroy(); close.destroy(); });
  }

  _showCredits() {
    const text = 'Platformer V3\nPhaser 3 • New Super Mario Bros style\nMade with Cursor';
    const panel = this.add.graphics();
    panel.fillStyle(0x1a1a2e, 0.95);
    panel.fillRoundedRect(250, 180, 300, 120, 12);
    const title = this.add.text(CENTER_X, 200, 'Credits', { fontSize: '22px', color: '#ffd700', fontFamily: 'Arial' }).setOrigin(0.5, 0);
    const body = this.add.text(CENTER_X, 240, text, { fontSize: '14px', color: '#aaa', fontFamily: 'Arial' }).setOrigin(0.5, 0);
    const close = this.add.text(CENTER_X, 280, 'Close', { fontSize: '18px', color: '#fff', fontFamily: 'Arial' }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
    close.on('pointerdown', () => { panel.destroy(); title.destroy(); body.destroy(); close.destroy(); });
  }

  _openOptions() {
    const data = SaveManager.load();
    const opts = ['Reduced motion', 'High contrast', 'UI scale'];
    const idx = (this._optionsIdx || 0) % 3;
    if (idx === 0) {
      data.reducedMotion = !data.reducedMotion;
      this.add.text(CENTER_X, 480, 'Reduced motion: ' + (data.reducedMotion ? 'ON' : 'OFF'), { fontSize: '16px', color: '#aaa', fontFamily: 'Arial' }).setOrigin(0.5, 0);
    } else if (idx === 1) {
      data.highContrast = !data.highContrast;
      this.add.text(CENTER_X, 480, 'High contrast: ' + (data.highContrast ? 'ON' : 'OFF'), { fontSize: '16px', color: '#aaa', fontFamily: 'Arial' }).setOrigin(0.5, 0);
    } else {
      data.uiScale = (data.uiScale === 1.2) ? 1 : 1.2;
      this.add.text(CENTER_X, 480, 'UI scale: ' + data.uiScale, { fontSize: '16px', color: '#aaa', fontFamily: 'Arial' }).setOrigin(0.5, 0);
    }
    this._optionsIdx = (this._optionsIdx || 0) + 1;
    SaveManager.save(data);
  }

  _openControls() {
    this.scene.launch('ControlsScene');
  }

  _showRemapKeys() {
    const KeyCodes = Phaser.Input.Keyboard.KeyCodes;
    const defaults = { left: 'A', right: 'D', jump: 'SPACE', down: 'S', sprint: 'SHIFT', dash: 'X', fire: 'C' };
    const data = SaveManager.load();
    const bindings = data.keyBindings || {};
    const getKey = (id) => bindings[id] || defaults[id];
    const panel = this.add.graphics();
    panel.fillStyle(0x1a1a2e, 0.95);
    panel.fillRoundedRect(180, 80, 440, 380, 12);
    const title = this.add.text(CENTER_X, 100, 'Remap Keys (click row then press key)', { fontSize: '18px', color: '#ffd700', fontFamily: 'Arial' }).setOrigin(0.5, 0);
    const actions = ['left', 'right', 'jump', 'down', 'sprint', 'dash', 'fire'];
    const labels = { left: 'Left', right: 'Right', jump: 'Jump', down: 'Down', sprint: 'Sprint', dash: 'Dash', fire: 'Fire' };
    const texts = [];
    let listeningFor = null;
    const updateDisplay = () => {
      texts.forEach((t, i) => {
        if (t && t.setText) t.setText(labels[actions[i]] + ': ' + getKey(actions[i]));
      });
    };
    actions.forEach((id, i) => {
      const y = 145 + i * 32;
      const row = this.add.text(220, y, labels[id] + ': ' + getKey(id), { fontSize: '18px', color: '#ccc', fontFamily: 'Arial' }).setOrigin(0, 0).setInteractive({ useHandCursor: true });
      texts.push(row);
      row.on('pointerdown', () => {
        listeningFor = id;
        row.setColor('#ff0');
        row.setText(labels[id] + ': ... press key');
      });
    });
    const close = this.add.text(CENTER_X, 440, 'Close', { fontSize: '18px', color: '#fff', fontFamily: 'Arial' }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
    const onKey = (e) => {
      if (!listeningFor) return;
      const code = e.keyCode;
      const name = Object.keys(KeyCodes).find((k) => KeyCodes[k] === code);
      if (name && name !== 'ESC') {
        data.keyBindings = data.keyBindings || {};
        data.keyBindings[listeningFor] = name;
        SaveManager.save(data);
        texts[actions.indexOf(listeningFor)].setColor('#ccc');
        listeningFor = null;
        updateDisplay();
      }
    };
    this.input.keyboard.once('keydown', onKey);
    close.on('pointerdown', () => {
      this.input.keyboard.off('keydown', onKey);
      panel.destroy();
      title.destroy();
      texts.forEach((t) => t.destroy());
      close.destroy();
    });
  }

  _toggleFullscreen() {
    if (!this.scale.isFullscreen) {
      this.scale.startFullscreen();
    } else {
      this.scale.stopFullscreen();
    }
  }
}
