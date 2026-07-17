import { vec2, type Vec2 } from './Vec2'

import type { AnyCollider } from './Collider'
import type { RigidBody } from './RigidBody'

let nextId = 1

export interface GameObjectOptions {
  x?: number
  y?: number
  /** Free-text label for identifying things in event handlers ('ball', 'goal'...). */
  tag?: string
  /** Visual rotation in degrees. Does NOT rotate the hitbox — colliders stay axis-aligned. */
  rotation?: number
  body?: RigidBody | null
  collider?: AnyCollider | null
  /** Arbitrary user data — e.g. the spawn id, so handlers know WHICH ball hit. */
  data?: unknown
}

/**
 * "This is an object." The one thing every entity in the world is.
 * Position is the CENTER of the object, in arena pixels (y grows downward,
 * same as CSS). Physics and shape are optional attachments.
 */
export class GameObject {
  readonly id: number
  tag: string
  position: Vec2
  /** Degrees, clockwise. Rendering only — physics ignores it. */
  rotation: number
  body: RigidBody | null
  collider: AnyCollider | null
  data: unknown

  constructor(options: GameObjectOptions = {}) {
    this.id = nextId++
    this.tag = options.tag ?? ''
    this.position = vec2(options.x ?? 0, options.y ?? 0)
    this.rotation = options.rotation ?? 0
    this.body = options.body ?? null
    this.collider = options.collider ?? null
    this.data = options.data
  }

  // Convenience forwards to the body, safe to call on anything — an
  // object without a rigidbody just ignores them. Lets event handlers
  // write `payload.other.applyImpulse(0, -400)` with no null checks.

  applyImpulse(x: number, y: number) {
    this.body?.applyImpulse(x, y)
  }

  setVelocity(x?: number, y?: number) {
    this.body?.setVelocity(x, y)
  }

  stop() {
    this.body?.stop()
  }
}
