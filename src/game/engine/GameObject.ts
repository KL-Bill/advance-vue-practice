import { vec2, type Vec2 } from './Vec2'

import type { AnyCollider } from './Collider'
import type { RigidBody } from './RigidBody'

let nextId = 1

export interface GameObjectOptions {
  /** Spawn position. Optional — defaults to 0, 0. */
  x?: number
  y?: number
  /** Free-text label for identifying things in event handlers ('ball', 'goal'...). */
  tag?: string
  /** Visual rotation in degrees. Does NOT rotate the hitbox — colliders stay axis-aligned. */
  rotation?: number
  /** Self-velocity (px/s) for objects WITHOUT a RigidBody. Ignored when a body exists. */
  vx?: number
  vy?: number
  /**
   * How a bodiless object reacts when it runs into a solid:
   * 0 = stop dead / slide along it (players, paddles) — the default.
   * 1 = full rebound, no speed lost (pong balls).
   */
  bounce?: number
  body?: RigidBody | null
  collider?: AnyCollider | null
  /** Arbitrary user data — e.g. the spawn id, so handlers know WHICH ball hit. */
  data?: unknown
}

/**
 * "This is an object." The one thing every entity in the world is.
 * Position is the CENTER of the object, in arena pixels (y grows downward,
 * same as CSS). Shape and physics are optional attachments.
 *
 * WHO MOVES IT — one owner, always:
 * - No body: YOU do. Write `position` directly, or set `vx`/`vy` and the
 *   world glides it (no gravity, never shoved by anything).
 * - RigidBody: the WORLD does — gravity, momentum, shoves. You only nudge
 *   it through applyImpulse / setVelocity.
 */
export class GameObject {
  readonly id: number
  tag: string
  position: Vec2
  /** Degrees, clockwise. Rendering only — physics ignores it. */
  rotation: number
  /** False after kill(). Dead objects are invisible and touch nothing. */
  alive: boolean
  /** Self-velocity (px/s), used only when there is no RigidBody. */
  vx: number
  vy: number
  /** Bodiless contact response: 0 = stop/slide (default), 1 = full rebound. */
  bounce: number
  body: RigidBody | null
  collider: AnyCollider | null
  data: unknown

  constructor(options: GameObjectOptions = {}) {
    this.id = nextId++
    this.tag = options.tag ?? ''
    this.position = vec2(options.x ?? 0, options.y ?? 0)
    this.rotation = options.rotation ?? 0
    this.alive = true
    this.vx = options.vx ?? 0
    this.vy = options.vy ?? 0
    this.bounce = options.bounce ?? 0
    this.body = options.body ?? null
    this.collider = options.collider ?? null
    this.data = options.data
  }

  // ---- lifecycle ------------------------------------------------------

  /**
   * Unity-style Destroy: the object vanishes — stops rendering, stops
   * colliding, fires trigger-exit to anything it was inside. Safe to call
   * from any event handler: `payload.self.kill()`.
   */
  kill() {
    this.alive = false
  }

  /** Undo kill(): the object reappears exactly where it was. */
  revive() {
    this.alive = true
  }

  // ---- motion (works with OR without a RigidBody) ---------------------

  /**
   * Instant push that ADDS to current motion. Positive y is down, so a
   * jump/shot upward is applyImpulse(0, -450). With a body it stacks
   * momentum; without one it adds to the object's own vx/vy.
   */
  applyImpulse(x: number, y: number) {
    if (this.body) {
      this.body.applyImpulse(x, y)
    } else {
      this.vx += x
      this.vy += y
    }
  }

  /**
   * Hard override of the motion. Pass `undefined` to leave an axis alone:
   * setVelocity(undefined, -450) changes only the vertical speed.
   */
  setVelocity(x?: number, y?: number) {
    if (this.body) {
      this.body.setVelocity(x, y)
    } else {
      if (x !== undefined) this.vx = x
      if (y !== undefined) this.vy = y
    }
  }

  /** Dead stop. */
  stop() {
    if (this.body) {
      this.body.stop()
    } else {
      this.vx = 0
      this.vy = 0
    }
  }
}
