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
}
