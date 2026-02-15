import Phaser from 'phaser';
import { PlayerPhysics as P } from '../physics/PlayerPhysics.js';

/** Player states for movement logic */
const State = {
  IDLE: 'idle',
  WALK: 'walk',
  SPRINT: 'sprint',
  JUMP: 'jump',
  FALL: 'fall',
  WALL_SLIDE: 'wall_slide',
  GROUND_POUND: 'ground_pound',
  TRIPLE_JUMP: 'triple_jump',
  LEVEL_CLEAR: 'level_clear',
};

/**
 * New Super Mario Bros-style player with wall jump, ground pound, triple jump, sprint,
 * squash/stretch, and tunable physics via PlayerPhysics.
 */
export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player_placeholder');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setTint(0xff3333); // Red placeholder for Mario
    this.setOrigin(0.5, 1);
    this.body.setSize(28, 44);
    this.body.setOffset(2, 4);
    this.body.setCollideWorldBounds(true);

    // Movement state
    this.state = State.IDLE;
    this.facingRight = true;
    this.onGround = false;
    this.touchingWall = false;
    this.wallSide = 0; // -1 left, 1 right
    this.sprintHeld = false;

    // Jump combo for triple jump (three consecutive ground jumps within window)
    this.jumpCount = 0;
    this.lastJumpTime = 0;
    this.groundTime = 0;
    this.wallJumpLockUntil = 0;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.jumpHoldTimer = 0;

    // Ground pound
    this.groundPoundStallTimer = 0;
    this.groundPoundActive = false;
    this.groundPoundStartY = 0;

    // Squash & stretch
    this.squashStretchTween = null;
    this.baseScaleX = 1;
    this.baseScaleY = 1;

    // Flip animation for triple jump (rotation)
    this.tripleJumpRotation = 0;
  }

  /** Called from scene update. */
  update(keys, time, delta) {
    this.keys = keys;
    const dt = delta / 1000;
    if (this.state === State.LEVEL_CLEAR) return;

    this._updateOnGround();
    this._updateCoyoteAndBuffer(keys, dt);
    this._updateGroundPound(dt);
    if (this.groundPoundActive) {
      this._applyGroundPound();
      return;
    }

    this._updateWallSlide();
    this._updateHorizontalInput(keys, dt);
    this._updateJump(keys, time, dt);
    this._applyGravity(dt);
    this._clampVelocity();
    this._updateFacing();
    this._updateState();
  }

  _updateOnGround() {
    this.onGround = this.body.blocked.down || this.body.touching.down;
    if (this.onGround) {
      this.coyoteTimer = P.coyoteTime;
      this.groundTime += this.scene.game.loop.delta / 1000;
      if (this.groundTime > P.jumpComboWindow && P.jumpComboResetOnLand) this.jumpCount = 0;
      if (this.state !== State.GROUND_POUND) this.groundPoundActive = false;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - this.scene.game.loop.delta / 1000);
      this.groundTime = 0;
    }
  }

  _updateCoyoteAndBuffer(keys, dt) {
    if (keys.down && keys.down.isDown && !this.onGround && !this.groundPoundActive)
      this._startGroundPound();
    if (keys.jump && keys.jump.isDown) this.jumpBufferTimer = P.jumpBufferTime;
    this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);
  }

  _startGroundPound() {
    if (this.groundPoundActive) return;
    this.groundPoundActive = true;
    this.groundPoundStallTimer = P.groundPoundStallTime;
    this.groundPoundStartY = this.y;
    this.setVelocity(0, 0);
    this.state = State.GROUND_POUND;
  }

  _updateGroundPound(dt) {
    if (!this.groundPoundActive) return;
    if (this.groundPoundStallTimer > 0) {
      this.groundPoundStallTimer -= dt;
      this.setVelocity(0, 0);
      return;
    }
  }

  _applyGroundPound() {
    if (this.groundPoundStallTimer > 0) return;
    this.body.setAllowGravity(true);
    const g = P.groundPoundGravity;
    let vy = this.body.velocity.y;
    vy += g * (this.scene.game.loop.delta / 1000);
    if (vy > P.groundPoundTerminalVelocity) vy = P.groundPoundTerminalVelocity;
    this.setVelocity(this.body.velocity.x, vy);
    if (this.onGround) {
      const fallDist = this.y - this.groundPoundStartY;
      if (fallDist >= P.groundPoundMinHeight) this.scene.events.emit('ground-pound-land');
      this.groundPoundActive = false;
    }
  }

  _updateWallSlide() {
    this.touchingWall = this.body.blocked.left || this.body.blocked.right;
    this.wallSide = this.body.blocked.left ? -1 : this.body.blocked.right ? 1 : 0;
    if (!this.onGround && this.touchingWall && this.state !== State.GROUND_POUND) {
      const move = this.keys;
      const towardWall = move && ((this.wallSide === -1 && move.right && move.right.isDown) || (this.wallSide === 1 && move.left && move.left.isDown));
      if (towardWall || this.body.velocity.y > 0) {
        this.state = State.WALL_SLIDE;
        let vy = this.body.velocity.y;
        if (vy > P.wallSlideSpeed) vy = P.wallSlideSpeed;
        this.setVelocity(this.body.velocity.x, vy);
      }
    }
  }

  _updateHorizontalInput(keys, dt) {
    if (this.groundPoundActive || this.state === State.LEVEL_CLEAR) return;
    const left = keys.left && keys.left.isDown;
    const right = keys.right && keys.right.isDown;
    this.sprintHeld = keys.sprint && keys.sprint.isDown;
    const maxSpeed = this.sprintHeld ? P.sprintMaxSpeed : P.walkMaxSpeed;
    const accel = this.sprintHeld ? P.sprintAcceleration : P.acceleration;
    const friction = this.onGround ? P.friction : P.airFriction;
    let vx = this.body.velocity.x;

    if (this.wallJumpLockUntil > this.scene.time.now) {
      // Allow only wall direction movement during lock
      return;
    }

    if (left && !right) {
      vx -= accel * dt;
      this.facingRight = false;
    } else if (right && !left) {
      vx += accel * dt;
      this.facingRight = true;
    } else {
      vx *= friction;
    }
    vx = Phaser.Math.Clamp(vx, -maxSpeed, maxSpeed);
    this.setVelocityX(vx);
  }

  _updateJump(keys, time, dt) {
    if (this.groundPoundActive) return;
    const canJump = this.coyoteTimer > 0 || this.jumpBufferTimer > 0;
    const tryJump = keys.jump && keys.jump.isDown;

    if (tryJump && this.touchingWall && !this.onGround && this.wallSide !== 0) {
      this._doWallJump();
      this.jumpBufferTimer = 0;
      this.coyoteTimer = 0;
      return;
    }

    if (tryJump && canJump && this.wallJumpLockUntil <= time) {
      const now = time / 1000;
      const comboElapsed = now - this.lastJumpTime;
      const withinCombo = comboElapsed <= P.jumpComboWindow;

      if (withinCombo && this.jumpCount >= 2) {
        this._doTripleJump();
      } else {
        this._doNormalJump();
      }
      this.jumpBufferTimer = 0;
      this.coyoteTimer = 0;
    }

    if (this.state === State.JUMP || this.state === State.TRIPLE_JUMP) {
      if (keys.jump && keys.jump.isDown && this.jumpHoldTimer < P.jumpHoldFrames) {
        this.body.velocity.y *= P.jumpHoldGravityScale;
        this.jumpHoldTimer++;
      }
    }
  }

  _doWallJump() {
    this.wallJumpLockUntil = this.scene.time.now + P.wallJumpLockHorizontalTime * 1000;
    const dir = -this.wallSide;
    this.setVelocity(dir * P.wallJumpHorizontalVelocity, P.wallJumpVerticalVelocity);
    this.facingRight = dir > 0;
    this.jumpCount = 0;
    this.lastJumpTime = this.scene.time.now / 1000;
    this.state = State.JUMP;
    this.jumpHoldTimer = 0;
    this._stretchJump();
  }

  _doNormalJump() {
    this.setVelocityY(P.jumpVelocity);
    this.jumpCount++;
    this.lastJumpTime = this.scene.time.now / 1000;
    this.state = State.JUMP;
    this.jumpHoldTimer = 0;
    this._stretchJump();
  }

  _doTripleJump() {
    const vx = this.body.velocity.x;
    this.setVelocity(
      vx * P.tripleJumpHorizontalBoost,
      P.tripleJumpVerticalVelocity
    );
    this.jumpCount = 0;
    this.lastJumpTime = this.scene.time.now / 1000;
    this.state = State.TRIPLE_JUMP;
    this.jumpHoldTimer = 0;
    this.tripleJumpRotation = 0;
    this._stretchJump();
  }

  _applyGravity(dt) {
    if (this.state === State.LEVEL_CLEAR || this.groundPoundActive) return;
    if (this.groundPoundStallTimer > 0) return;
    this.body.setAllowGravity(true);
    let vy = this.body.velocity.y;
    const g = (this.state === State.WALL_SLIDE && this.body.velocity.y >= 0)
      ? P.gravity * 0.2
      : P.gravity;
    vy += g * dt;
    if (vy > P.terminalVelocity) vy = P.terminalVelocity;
    this.setVelocityY(vy);
  }

  _clampVelocity() {
    if (this.groundPoundActive) return;
    const v = this.body.velocity;
    if (v.y > P.terminalVelocity) this.setVelocityY(P.terminalVelocity);
  }

  _updateFacing() {
    if (this.body.velocity.x > 10) this.facingRight = true;
    if (this.body.velocity.x < -10) this.facingRight = false;
    this.setFlipX(!this.facingRight);
  }

  _updateState() {
    if (this.groundPoundActive) return;
    if (this.state === State.TRIPLE_JUMP) {
      this.tripleJumpRotation += 0.25;
      this.setAngle(this.facingRight ? this.tripleJumpRotation * 90 : -this.tripleJumpRotation * 90);
      if (this.body.velocity.y > 0) {
        this.state = State.FALL;
        this.setAngle(0);
      }
      return;
    }
    if (this.onGround) {
      this.setAngle(0);
      this.state = Math.abs(this.body.velocity.x) > 20
        ? (this.sprintHeld ? State.SPRINT : State.WALK)
        : State.IDLE;
    } else {
      if (this.state !== State.WALL_SLIDE)
        this.state = this.body.velocity.y < 0 ? State.JUMP : State.FALL;
    }
  }

  _stretchJump() {
    if (this.squashStretchTween) this.squashStretchTween.stop();
    this.setScale(P.stretchJumpScaleX, P.stretchJumpScaleY);
    this.squashStretchTween = this.scene.tweens.add({
      targets: this,
      scaleX: this.baseScaleX,
      scaleY: this.baseScaleY,
      duration: P.squashStretchDuration,
      ease: 'Quad.easeOut',
    });
  }

  /** Call when player lands on ground (e.g. from scene collision). */
  onLand() {
    if (this.state === State.GROUND_POUND) return;
    this._squashLand();
  }

  _squashLand() {
    if (this.squashStretchTween) this.squashStretchTween.stop();
    this.setScale(P.squashLandScaleX, P.squashLandScaleY);
    this.squashStretchTween = this.scene.tweens.add({
      targets: this,
      scaleX: this.baseScaleX,
      scaleY: this.baseScaleY,
      duration: P.squashStretchDuration,
      ease: 'Back.easeOut',
    });
  }

  triggerLevelClear() {
    this.state = State.LEVEL_CLEAR;
    this.body.setVelocity(0, 0);
    this.body.setAllowGravity(false);
  }
}
