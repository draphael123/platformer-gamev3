/**
 * PlayerPhysics - Tunable physics parameters for NSMB-style movement.
 * Adjust these to tune feel: gravity, friction, acceleration, terminal velocity, jump strength, etc.
 */
export const PlayerPhysics = {
  // --- Gravity & Fall ---
  gravity: 1200,
  terminalVelocity: 720,
  fallMultiplier: 1.35,        // faster fall for snappier feel

  // --- Horizontal Movement ---
  acceleration: 480,
  deceleration: 520,
  friction: 0.82,             // ground friction (0–1, lower = more slide)
  airFriction: 0.98,          // air control
  walkMaxSpeed: 180,
  sprintMaxSpeed: 320,
  sprintAcceleration: 620,

  // --- Jump ---
  jumpVelocity: -420,
  jumpHoldGravityScale: 0.45, // hold jump = higher arc
  jumpHoldFrames: 12,
  coyoteTime: 0.12,           // seconds after leaving ground to still jump
  jumpBufferTime: 0.15,       // seconds before landing to buffer jump

  // --- Wall Slide & Wall Jump ---
  wallSlideSpeed: 120,
  wallJumpHorizontalVelocity: 280,
  wallJumpVerticalVelocity: -380,
  wallStickTime: 0.08,        // brief stick before sliding
  wallJumpLockHorizontalTime: 0.18, // can't reverse direction immediately

  // --- Ground Pound ---
  groundPoundStallTime: 0.2,
  groundPoundGravity: 2400,
  groundPoundTerminalVelocity: 900,
  groundPoundMinHeight: 40,   // min fall distance to trigger slam effect

  // --- Triple Jump ---
  tripleJumpVerticalVelocity: -480,
  tripleJumpHorizontalBoost: 1.25,
  jumpComboWindow: 0.35,      // seconds between jumps to count as combo
  jumpComboResetOnLand: true,

  // --- Squash & Stretch (visual tuning) ---
  squashLandScaleX: 1.25,
  squashLandScaleY: 0.7,
  stretchJumpScaleX: 0.85,
  stretchJumpScaleY: 1.2,
  squashStretchDuration: 120, // ms to animate back to 1,1

  // --- Water / Swim ---
  waterGravity: 200,
  waterTerminalVelocity: 120,
  swimUpVelocity: -200,

  // --- Dash ---
  dashSpeed: 450,
  dashDuration: 0.15,
  dashCooldown: 0.6,
};

export default PlayerPhysics;
