# Platformer V3 – New Super Mario Bros Style

A 2D platformer built with **Phaser.js** and modular JavaScript, replicating the feel and mechanics of New Super Mario Bros.

## Run the game

```bash
npm install
npm run dev
```

Open **http://localhost:5173** in your browser. For a production-style build: `npm run build` then `npm run preview`.

## Controls

| Key | Action |
|-----|--------|
| **A / D** or **Arrow Left/Right** | Move |
| **Shift** | Sprint (longer jump arc) |
| **Space** | Jump |
| **S** or **Down** (in air) | Ground pound |
| **S** or **Down** (on ground) | Duck / crawl |
| **ESC** | Pause menu |
| **Gamepad** | Left stick move, A jump, trigger sprint, stick down = duck/pound |

## Mechanics

- **Wall jump**: Slide against a wall (move toward it), then press Jump to leap off.
- **Ground pound**: Press Down while in the air to stall, then slam down. Camera shakes on landing.
- **Triple jump**: Perform three jumps in a row (land briefly between each) within the combo window for a higher third jump with a flip.
- **Sprint**: Hold Shift while moving for higher top speed and longer jump distance.
- **Duck**: Hold Down on ground to duck (no movement).
- **Stomp**: Jump on enemies to kill them and bounce; touching them otherwise costs a life.
- **Lives**: 3 lives per run; fall in pit or touch enemy to lose one. Respawn at last checkpoint. Game over returns to menu.
- **Timer**: 300 seconds per level; time left at flag = bonus points. Running out kills you.
- **Combo**: Collect coins in quick succession for a score multiplier.
- **High score & best time**: Saved in browser (localStorage). Options: reduced motion, fullscreen.

## Tuning physics

Edit **`src/physics/PlayerPhysics.js`** to adjust:

- `gravity`, `terminalVelocity`, `friction`, `acceleration`
- `walkMaxSpeed`, `sprintMaxSpeed`
- `jumpVelocity`, `coyoteTime`, `jumpBufferTime`
- Wall slide/jump speeds and timings
- Ground pound stall time and gravity
- Triple jump strength and combo window
- Squash & stretch scale and duration

## Placeholder assets

- **Red** – Player (Mario)
- **Yellow** – Coins
- **Green** – Pipes and flagpole
- **Brown** – Blocks / platforms
- **Gray** – Ground
- **Dark red** – Enemies (stomp to kill)

Replace these in `GameScene.create()` and your asset pipeline when adding real art.

## Scenes

- **BootScene** → **MenuScene** (title, Level 1/2, Options, Controls, Fullscreen, high score).
- **GameScene** – Play level: lives, timer, checkpoints, enemies, flagpole slide, pause (Resume / Restart / Quit).
- **ControlsScene** – Overlay listing all controls.

## Deploy (GitHub + Vercel)

1. **GitHub**: Code is pushed to [github.com/draphael123/platformer-gamev3](https://github.com/draphael123/platformer-gamev3).
2. **Vercel**:
   - Go to [vercel.com](https://vercel.com) and sign in (with GitHub).
   - Click **Add New… → Project**, import **platformer-gamev3**.
   - Leave **Build Command** as `npm run build` and **Output Directory** as `dist` (required; set in `vercel.json`). If the live site is blank, confirm in Project Settings → General that **Output Directory** is exactly `dist`.
   - Click **Deploy**. Your game will be live at `https://platformer-gamev3-*.vercel.app` (or your custom domain).

Later: push to `main` and Vercel will auto-deploy.

## Project structure

```
src/
  main.js           – Entry point, scene registration
  config.js         – Phaser config
  constants.js      – EVENTS, DEPTH, DEFAULT_LIVES, LEVEL_TIME_LIMIT, SAVE_KEY
  physics/
    PlayerPhysics.js – Tunable movement constants
  entities/
    Player.js       – Player (movement, duck, squash/stretch)
    Enemy.js        – Walker enemy (stomp to kill)
  services/
    EventBus.js     – Global event emitter
    SaveManager.js  – localStorage save/load (high score, best time, options)
    AudioManager.js – SFX/music hook (reduced motion)
  scenes/
    BootScene.js    – Load, then MenuScene
    MenuScene.js    – Title, Level 1/2, Options, Controls, Fullscreen
    ControlsScene.js – Controls overlay
    GameScene.js    – Level play (lives, timer, checkpoints, enemies, pause)
```
