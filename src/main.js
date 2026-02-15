import Phaser from 'phaser';
import config from './config.js';
import GameScene from './scenes/GameScene.js';

function hideLoader() {
  const el = document.getElementById('load-status');
  if (el) el.style.display = 'none';
}

function showError(msg, detail) {
  hideLoader();
  const el = document.getElementById('error-msg');
  if (el) {
    el.textContent = detail ? msg + '\n\n' + detail : msg;
    el.style.display = 'block';
    el.style.whiteSpace = 'pre-wrap';
    el.style.fontSize = '12px';
  }
  console.error('[Platformer]', msg, detail || '');
}

window.addEventListener('error', function (e) {
  var detail = (e.error && e.error.stack) ? e.error.stack : (e.filename ? e.filename + ':' + e.lineno + ':' + e.colno : '');
  showError('Error: ' + (e.message || String(e)), detail);
});
window.addEventListener('unhandledrejection', function (e) {
  var msg = (e.reason && e.reason.message) ? e.reason.message : String(e.reason);
  var detail = (e.reason && e.reason.stack) ? e.reason.stack : '';
  showError('Error: ' + msg, detail);
});

try {
  hideLoader();
  var game = new Phaser.Game(config);
  game.events.once('ready', function () {
    try {
      game.scene.add('GameScene', GameScene, true);
    } catch (sceneErr) {
      showError('Scene add failed: ' + (sceneErr.message || sceneErr), sceneErr.stack);
      return;
    }
    var canvas = document.querySelector('#game-container canvas');
    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      showError('Canvas did not start. Try a different browser or disable hardware acceleration.');
    }
  });
} catch (e) {
  showError('Failed to load game: ' + (e.message || String(e)), e.stack);
}
