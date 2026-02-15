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

window.addEventListener('error', function (e) {
  showError('Error: ' + (e.message || String(e)));
});
window.addEventListener('unhandledrejection', function (e) {
  showError('Error: ' + (e.reason?.message || String(e.reason)));
});

(async function () {
  try {
    const Phaser = (await import('phaser')).default;
    const { default: config } = await import('./config.js');
    hideLoader();
    const game = new Phaser.Game(config);
    game.events.once('ready', function () {
      const canvas = document.querySelector('#game-container canvas');
      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        showError('Canvas did not start. Try a different browser or disable hardware acceleration.');
      }
    });
  } catch (e) {
    showError('Failed to load game: ' + (e.message || String(e)));
  }
})();
