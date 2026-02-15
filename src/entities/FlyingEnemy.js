import Phaser from 'phaser';

/** Flying enemy: moves in a horizontal path with vertical sine wave. */
export default class FlyingEnemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, speed = 40, amplitude = 60) {
    super(scene, x, y, 'enemy_placeholder');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setTint(0x4a0080);
    this.setOrigin(0.5, 0.5);
    this.body.setSize(24, 24);
    this.body.setAllowGravity(false);
    this.body.setVelocityX(-speed);
    this.speed = speed;
    this.amplitude = amplitude;
    this.baseY = y;
    this.time = 0;
  }

  update() {
    this.time += 0.05;
    const vy = Math.sin(this.time) * this.amplitude;
    this.setVelocityY(vy);
    if (this.body.blocked.left || this.body.touching.left) this.setVelocityX(this.speed);
    if (this.body.blocked.right || this.body.touching.right) this.setVelocityX(-this.speed);
  }
}
