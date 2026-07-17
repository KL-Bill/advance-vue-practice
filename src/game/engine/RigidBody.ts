import { vec2, type Vec2 } from './Vec2'

export interface RigidBodyOptions {
  /** Initial velocity, px/second. */
  vx?: number
  vy?: number
  /** 1 = full gravity, 0 = floats. */
  gravityScale?: number
  /** 0 = dead stop on impact, 1 = perfectly elastic bounce. */
  bounciness?: number
  /** Static bodies never move, but others bounce off them. */
  isStatic?: boolean
}

/**
 * "This has physics." Attach one of these to a GameObject and the World
 * will apply gravity, move it, and bounce it off things each frame.
 */
export class RigidBody {
  velocity: Vec2
  gravityScale: number
  bounciness: number
  isStatic: boolean

  constructor(options: RigidBodyOptions = {}) {
    this.velocity = vec2(options.vx ?? 0, options.vy ?? 0)
    this.gravityScale = options.gravityScale ?? 1
    this.bounciness = options.bounciness ?? 0.6
    this.isStatic = options.isStatic ?? false
  }

  /**
   * Instant kick that ADDS to the current motion (a physics "impulse").
   * Positive y is down, so a jump is applyImpulse(0, -450).
   * Use when momentum should stack: boosts, explosions, flappy flaps.
   */
  applyImpulse(x: number, y: number) {
    this.velocity.x += x
    this.velocity.y += y
  }

  /**
   * Hard override of the motion, ignoring whatever it was doing.
   * Use for predictable results: a jump of consistent height, a dash
   * of fixed speed. Pass `undefined` to leave an axis untouched:
   * setVelocity(undefined, -450) = classic jump that keeps run speed.
   */
  setVelocity(x?: number, y?: number) {
    if (x !== undefined) this.velocity.x = x
    if (y !== undefined) this.velocity.y = y
  }

  /** Dead stop. */
  stop() {
    this.velocity.x = 0
    this.velocity.y = 0
  }
}
