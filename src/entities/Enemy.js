import Phaser from 'phaser';

/** Simple walker enemy: moves back and forth, kill by stomping. */
export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, speed = 60) {
    super(scene, x, y, 'enemy_placeholder');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setTint(0x8b0000);
    this.setOrigin(0.5, 1);
    this.body.setSize(24, 28);
    this.body.setOffset(4, 4);
    this.speed = speed;
    this.setVelocityX(-speed);
    this.setCollideWorldBounds(false);
    this.body.setAllowGravity(true);
  }

  update() {
    if (this.body.blocked.left || this.body.touching.left) this.setVelocityX(this.speed);
    if (this.body.blocked.right || this.body.touching.right) this.setVelocityX(-this.speed);
  }
}
