import Phaser from 'phaser';

/** Bouncing enemy: walks and bounces when hitting ground. */
export default class BouncingEnemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, speed = 50, bounceVelocity = -280) {
    super(scene, x, y, 'enemy_placeholder');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setTint(0x228822);
    this.setOrigin(0.5, 1);
    this.body.setSize(24, 28);
    this.body.setOffset(4, 4);
    this.speed = speed;
    this.bounceVelocity = bounceVelocity;
    this.setVelocityX(-speed);
    this.setCollideWorldBounds(false);
    this.body.setAllowGravity(true);
  }

  update() {
    if (this.body.blocked.left || this.body.touching.left) this.setVelocityX(this.speed);
    if (this.body.blocked.right || this.body.touching.right) this.setVelocityX(-this.speed);
    if (this.body.blocked.down || this.body.touching.down) {
      if (this.body.velocity.y >= 0) this.setVelocityY(this.bounceVelocity);
    }
  }
}
