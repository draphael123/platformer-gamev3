function hideLoader() {
  const el = document.getElementById('load-status');
  if (el) el.style.display = 'none';
}
function showError(msg) {
  hideLoader();
  const el = document.getElementById('error-msg');
  if (el) {
    el.textContent = msg;
    el.style.display = 'block';
  }
  console.error('[Platformer]', msg);
}

(async function () {
  try {
    const Phaser = (await import('phaser')).default;
    const { default: config } = await import('./config.js');
    hideLoader();
    new Phaser.Game(config);
  } catch (e) {
    showError('Failed to load game: ' + (e.message || String(e)));
  }
})();
