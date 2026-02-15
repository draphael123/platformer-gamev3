import Phaser from 'phaser';

/** Fireball projectile: moves horizontally, kills enemies, destroyed on wall/ground. */
export default class Fireball extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, right) {
    super(scene, x, y, 'coin_placeholder');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setTint(0xff6600);
    this.setOrigin(0.5, 0.5);
    this.body.setSize(12, 12);
    this.body.setAllowGravity(false);
    const speed = right ? 320 : -320;
    this.setVelocityX(speed);
  }
}
