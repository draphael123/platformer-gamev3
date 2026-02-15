import Phaser from 'phaser';

export default class ControlsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ControlsScene' });
  }

  create() {
    const panel = this.add.graphics();
    panel.fillStyle(0x000000, 0.85);
    panel.fillRoundedRect(100, 80, 600, 320, 12);
    this.add.text(400, 100, 'Controls', {
      fontSize: '28px',
      color: '#fff',
      fontFamily: 'Arial',
    }).setOrigin(0.5, 0);
    const lines = [
      'W / Arrow Up / Space — Jump',
      'A / D or Arrows — Move',
      'Shift — Sprint   X — Dash   C — Fire (when you have fire flower)',
      'S / Down (in air) — Ground pound; at pipe — enter/warp',
      'ESC — Pause',
      '',
      'Triple jump: 3 jumps in a row (quick)',
      'Wall jump: slide on wall, then jump',
      'Some pipes lead to bonus rooms (hold Down to enter).',
    ];
    lines.forEach((line, i) => {
      this.add.text(400, 140 + i * 24, line, {
        fontSize: '16px',
        color: '#ccc',
        fontFamily: 'Arial',
      }).setOrigin(0.5, 0);
    });
    const close = this.add.text(400, 370, 'Click or press any key to close', {
      fontSize: '14px',
      color: '#888',
      fontFamily: 'Arial',
    }).setOrigin(0.5, 0);
    this.input.once('pointerdown', () => this.scene.stop('ControlsScene'));
    this.input.keyboard.once('keydown', () => this.scene.stop('ControlsScene'));
  }
}
