/**
 * Colliders give a GameObject a physical shape. Each collider has exactly
 * one mode:
 *
 * - 'collide' (default): solid. Blocks and bounces things; contacts fire
 *   `collision` events.
 * - 'trigger': sensor. Things pass THROUGH it; overlaps fire
 *   `trigger-enter` / `trigger-exit` events. Goals, coins, checkpoints...
 *
 * No collider at all = decoration: can't touch, can't be touched.
 */
export type ColliderMode = 'collide' | 'trigger'

/** Accepts the old boolean form too: true = 'trigger', false = 'collide'. */
function normalizeMode(mode: ColliderMode | boolean): ColliderMode {
  if (mode === true) return 'trigger'
  if (mode === false) return 'collide'
  return mode
}

export abstract class Collider {
  mode: ColliderMode

  constructor(mode: ColliderMode | boolean = 'collide') {
    this.mode = normalizeMode(mode)
  }

  get isTrigger(): boolean {
    return this.mode === 'trigger'
  }
}

export class CircleCollider extends Collider {
  readonly shape = 'circle' as const
  radius: number

  constructor(radius: number, mode: ColliderMode | boolean = 'collide') {
    super(mode)
    this.radius = radius
  }
}

export class BoxCollider extends Collider {
  readonly shape = 'box' as const
  width: number
  height: number

  constructor(width: number, height: number, mode: ColliderMode | boolean = 'collide') {
    super(mode)
    this.width = width
    this.height = height
  }
}

/** Discriminated union — narrow on `.shape` to get the right fields. */
export type AnyCollider = CircleCollider | BoxCollider
