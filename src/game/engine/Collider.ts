/**
 * Colliders give a GameObject a physical shape.
 *
 * - Solid collider (isTrigger = false): things bounce off it.
 * - Trigger collider (isTrigger = true): things pass THROUGH it, but the
 *   World fires `trigger-enter` / `trigger-exit` events. Use it for goals,
 *   coins, checkpoints, lava zones...
 */
export abstract class Collider {
  isTrigger: boolean

  constructor(isTrigger = false) {
    this.isTrigger = isTrigger
  }
}

export class CircleCollider extends Collider {
  readonly shape = 'circle' as const
  radius: number

  constructor(radius: number, isTrigger = false) {
    super(isTrigger)
    this.radius = radius
  }
}

export class BoxCollider extends Collider {
  readonly shape = 'box' as const
  width: number
  height: number

  constructor(width: number, height: number, isTrigger = false) {
    super(isTrigger)
    this.width = width
    this.height = height
  }
}

/** Discriminated union — narrow on `.shape` to get the right fields. */
export type AnyCollider = CircleCollider | BoxCollider
