import Phaser from 'phaser';

const emitter = new Phaser.Events.EventEmitter();
if (typeof emitter.setMaxListeners === 'function') {
  emitter.setMaxListeners(20);
}

export function on(event, fn, context) {
  emitter.on(event, fn, context);
}

export function once(event, fn, context) {
  emitter.once(event, fn, context);
}

export function off(event, fn, context) {
  emitter.off(event, fn, context);
}

export function emit(event, ...args) {
  emitter.emit(event, ...args);
}

export default { on, once, off, emit };
