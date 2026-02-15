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

## Mechanics

- **Wall jump**: Slide against a wall (move toward it), then press Jump to leap off.
- **Ground pound**: Press Down while in the air to stall, then slam down. Camera shakes on landing.
- **Triple jump**: Perform three jumps in a row (land briefly between each) within the combo window for a higher third jump with a flip.
- **Sprint**: Hold Shift while moving for higher top speed and longer jump distance.

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

Replace these in `GameScene.create()` and your asset pipeline when adding real art.

## Deploy (GitHub + Vercel)

1. **GitHub**: Code is pushed to [github.com/draphael123/platformer-gamev3](https://github.com/draphael123/platformer-gamev3).
2. **Vercel**:
   - Go to [vercel.com](https://vercel.com) and sign in (with GitHub).
   - Click **Add New… → Project**, import **platformer-gamev3**.
   - Leave **Build Command** as `npm run build` and **Output Directory** as `dist` (set in `vercel.json`).
   - Click **Deploy**. Your game will be live at `https://platformer-gamev3-*.vercel.app` (or your custom domain).

Later: push to `main` and Vercel will auto-deploy.

## Project structure

```
src/
  main.js           – Entry point
  config.js         – Phaser config
  physics/
    PlayerPhysics.js – Tunable movement constants
  entities/
    Player.js       – Player class (movement, states, squash/stretch)
  scenes/
    GameScene.js    – Level, UI, coins, pipes, flagpole, camera
```
