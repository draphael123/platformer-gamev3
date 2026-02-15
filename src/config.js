import Phaser from 'phaser';

// No scene in config — we add it at runtime in main.js to avoid boot-time scene array handling
const config = {
  type: Phaser.CANVAS,
  width: 800,
  height: 480,
  parent: 'game-container',
  pixelArt: false,
  backgroundColor: '#1a1a2e',
  render: { antialias: true, roundPixels: false },
  failIfMajorPerformanceCaveat: false,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

export default config;
