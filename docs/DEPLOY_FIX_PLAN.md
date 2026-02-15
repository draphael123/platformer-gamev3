# Deploy fix plan (a[i] is not a function)

## Root cause hypothesis

The error `Uncaught TypeError: a[i] is not a function` (minified) happens when Phaser or our code indexes an array/object and then calls the result as a function. The value at that index is not a function.

## Changes applied

### 1. Runtime scene registration (bypass config boot)

- **Before:** `config.scene = [GameScene]` — Phaser’s boot loop iterates over this array and instantiates scenes.
- **After:** `config.scene = []` and in `main.js` we call `game.scene.add('GameScene', GameScene, true)` inside the game’s `ready` event.
- **Why:** Avoids any boot-time code path that might treat `config.scene[i]` incorrectly (e.g. bundler/export quirks). The scene is added after the game instance exists, so `add()` receives a direct reference to the class.

### 2. Canvas renderer

- **Change:** `type: Phaser.CANVAS` instead of `Phaser.AUTO`.
- **Why:** Removes WebGL from the path; if the bug was in a WebGL-only branch, this avoids it.

### 3. Better error reporting

- **Change:** Global `error` and `unhandledrejection` handlers now capture and display `e.error.stack` / `e.reason.stack` (and filename/line when available).
- **Why:** If the error persists, the on-screen error box and console will show the full stack trace so we can see the real file and line (sourcemaps are enabled in production).

### 4. Sourcemaps in production

- **Change:** `build.sourcemap: true` in `vite.config.js`.
- **Why:** Stack traces in the browser will resolve to original source files and line numbers.

### 5. Error UI

- Error box is scrollable (`max-height: 80vh`, `overflow-y: auto`), monospace, and left-aligned so long stack traces are readable.

### 6. No physics groups (fix for createCallbackHandler)

- **Change:** Replaced `this.physics.add.staticGroup()` and `this.physics.add.group()` with `this.add.group()`. We still call `this.physics.add.existing(child, true)` on each tile/coin, then `group.add(child)`.
- **Why:** The stack trace showed the error in `createCallbackHandler` inside Phaser’s Arcade StaticGroup/Group. When children are added to a physics group, it calls an internal callback that was ending up as a non-function after minification. Using a plain Group and attaching physics to each child avoids that path; `physics.add.collider(player, ground)` / `overlap(player, coins)` still work with plain groups.

## If the error still appears

1. Copy the **full error text and stack trace** from the red error box (or DevTools Console).
2. The stack will point to a specific file and line (thanks to sourcemaps).
3. Next steps can be: wrap `GameScene.create()` in try/catch and log, or switch to a plain-object scene (no class) to avoid `new Scene()` entirely.
