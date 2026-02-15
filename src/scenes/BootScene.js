import Phaser from 'phaser';
import SaveManager from '../services/SaveManager.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create() {
    SaveManager.load();
    this.scene.start('MenuScene');
  }
}
