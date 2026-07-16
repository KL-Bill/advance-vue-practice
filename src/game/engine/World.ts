import type { AnyCollider, BoxCollider, CircleCollider } from './Collider'
import type { GameObject } from './GameObject'

export type WorldEventType = 'collision' | 'trigger-enter' | 'trigger-exit'

export interface WorldEvent {
  type: WorldEventType
  a: GameObject
  b: GameObject
}

export type WorldListener = (event: WorldEvent) => void

/** A detected overlap. Normal points from `a` toward `b`. */
interface Contact {
  nx: number
  ny: number
  overlap: number
}

interface Pair {
  a: GameObject
  b: GameObject
}

const pairKey = (idA: number, idB: number) => (idA < idB ? `${idA}|${idB}` : `${idB}|${idA}`)

/** Bounce speeds below this (px/s) are zeroed so objects come to rest. */
const REST_THRESHOLD = 40

/**
 * The physics world. Owns every GameObject and, once per frame:
 *
 *   1. integrates: gravity -> velocity -> position
 *   2. bounces dynamic bodies off the arena walls
 *   3. tests every pair of colliders for overlap
 *      - solid vs solid  -> push apart, exchange impulse, fire 'collision'
 *      - anything trigger -> no physics, fire 'trigger-enter'/'trigger-exit'
 *
 * Events fire on the FRAME THE CONTACT STARTS (and, for triggers, ends) —
 * not every frame of overlap. That is what makes them usable as triggers:
 * "when the ball touches the goal" instead of "while the ball is in the goal".
 */
export class World {
  readonly width: number
  readonly height: number
  gravity: number

  private objects = new Map<number, GameObject>()
  private anyListeners = new Set<WorldListener>()
  private objectListeners = new Map<number, Set<WorldListener>>()
  /** Solid contacts alive last frame — used to detect NEW collisions. */
  private touchingPairs = new Map<string, Pair>()
  /** Trigger overlaps alive last frame — used for enter/exit edges. */
  private triggerPairs = new Map<string, Pair>()

  constructor(width: number, height: number, gravity = 900) {
    this.width = width
    this.height = height
    this.gravity = gravity
  }

  // ---- registry -----------------------------------------------------------

  add(obj: GameObject) {
    this.objects.set(obj.id, obj)
  }

  remove(obj: GameObject) {
    this.objects.delete(obj.id)
    this.objectListeners.delete(obj.id)
    // If the removed object was inside a trigger, the zone still deserves
    // its exit event (e.g. a collected coin leaving the collector's zone).
    for (const [key, pair] of this.triggerPairs) {
      if (pair.a.id === obj.id || pair.b.id === obj.id) {
        this.triggerPairs.delete(key)
        this.dispatch({ type: 'trigger-exit', a: pair.a, b: pair.b })
      }
    }
    for (const [key, pair] of this.touchingPairs) {
      if (pair.a.id === obj.id || pair.b.id === obj.id) this.touchingPairs.delete(key)
    }
  }

  // ---- event subscriptions ------------------------------------------------

  /** Listen to every event in the world. Returns an unsubscribe function. */
  onAny(listener: WorldListener): () => void {
    this.anyListeners.add(listener)
    return () => this.anyListeners.delete(listener)
  }

  /** Listen only to events involving one object. Returns an unsubscribe function. */
  onObject(id: number, listener: WorldListener): () => void {
    const set = this.objectListeners.get(id) ?? new Set<WorldListener>()
    set.add(listener)
    this.objectListeners.set(id, set)
    return () => set.delete(listener)
  }

  private dispatch(event: WorldEvent) {
    for (const listener of this.anyListeners) listener(event)
    this.objectListeners.get(event.a.id)?.forEach((listener) => listener(event))
    this.objectListeners.get(event.b.id)?.forEach((listener) => listener(event))
  }

  // ---- simulation ---------------------------------------------------------

  /** Advance the whole world by `dt` seconds. Called once per animation frame. */
  step(dt: number) {
    this.integrate(dt)
    this.collideWalls()
    this.collidePairs()
  }

  /** Apply gravity to velocity, velocity to position. */
  private integrate(dt: number) {
    for (const obj of this.objects.values()) {
      const body = obj.body
      if (!body || body.isStatic) continue
      body.velocity.y += this.gravity * body.gravityScale * dt
      obj.position.x += body.velocity.x * dt
      obj.position.y += body.velocity.y * dt
    }
  }

  private halfExtents(collider: AnyCollider): { hw: number; hh: number } {
    if (collider.shape === 'circle') return { hw: collider.radius, hh: collider.radius }
    return { hw: collider.width / 2, hh: collider.height / 2 }
  }

  /** Keep dynamic bodies inside the arena, bouncing with their bounciness. */
  private collideWalls() {
    for (const obj of this.objects.values()) {
      const body = obj.body
      if (!body || body.isStatic) continue
      const { hw, hh } = obj.collider ? this.halfExtents(obj.collider) : { hw: 0, hh: 0 }
      const pos = obj.position
      const vel = body.velocity

      if (pos.x - hw < 0) {
        pos.x = hw
        if (vel.x < 0) vel.x = -vel.x * body.bounciness
      } else if (pos.x + hw > this.width) {
        pos.x = this.width - hw
        if (vel.x > 0) vel.x = -vel.x * body.bounciness
      }

      if (pos.y - hh < 0) {
        pos.y = hh
        if (vel.y < 0) vel.y = -vel.y * body.bounciness
      } else if (pos.y + hh > this.height) {
        pos.y = this.height - hh
        if (vel.y > 0) {
          vel.y = -vel.y * body.bounciness
          if (Math.abs(vel.y) < REST_THRESHOLD) vel.y = 0
        }
      }
    }
  }

  /** Test every pair, resolve solid contacts, and fire edge events. */
  private collidePairs() {
    const list = Array.from(this.objects.values())
    const touching = new Map<string, Pair>()
    const triggering = new Map<string, Pair>()

    for (let i = 0; i < list.length; i++) {
      const a = list[i]
      if (!a || !a.collider) continue
      for (let j = i + 1; j < list.length; j++) {
        const b = list[j]
        if (!b || !b.collider) continue

        const isTriggerPair = a.collider.isTrigger || b.collider.isTrigger
        const aDynamic = !!a.body && !a.body.isStatic
        const bDynamic = !!b.body && !b.body.isStatic
        // Two immovable solids can never produce anything interesting.
        if (!isTriggerPair && !aDynamic && !bDynamic) continue

        const contact = this.findContact(a, a.collider, b, b.collider)
        if (!contact) continue

        const key = pairKey(a.id, b.id)
        if (isTriggerPair) {
          triggering.set(key, { a, b })
          if (!this.triggerPairs.has(key)) this.dispatch({ type: 'trigger-enter', a, b })
        } else {
          touching.set(key, { a, b })
          this.resolve(a, b, contact)
          if (!this.touchingPairs.has(key)) this.dispatch({ type: 'collision', a, b })
        }
      }
    }

    for (const [key, pair] of this.triggerPairs) {
      if (!triggering.has(key)) this.dispatch({ type: 'trigger-exit', a: pair.a, b: pair.b })
    }
    this.touchingPairs = touching
    this.triggerPairs = triggering
  }

  // ---- overlap tests ------------------------------------------------------

  private findContact(
    a: GameObject,
    ca: AnyCollider,
    b: GameObject,
    cb: AnyCollider,
  ): Contact | null {
    if (ca.shape === 'circle' && cb.shape === 'circle') return this.circleCircle(a, ca, b, cb)
    if (ca.shape === 'circle' && cb.shape === 'box') return this.circleBox(a, ca, b, cb)
    if (ca.shape === 'box' && cb.shape === 'circle') {
      const contact = this.circleBox(b, cb, a, ca)
      if (!contact) return null
      return { nx: -contact.nx, ny: -contact.ny, overlap: contact.overlap }
    }
    return this.boxBox(a, ca as BoxCollider, b, cb as BoxCollider)
  }

  private circleCircle(
    a: GameObject,
    ca: CircleCollider,
    b: GameObject,
    cb: CircleCollider,
  ): Contact | null {
    const dx = b.position.x - a.position.x
    const dy = b.position.y - a.position.y
    const rSum = ca.radius + cb.radius
    const distSq = dx * dx + dy * dy
    if (distSq >= rSum * rSum) return null
    const dist = Math.sqrt(distSq)
    if (dist === 0) return { nx: 1, ny: 0, overlap: rSum }
    return { nx: dx / dist, ny: dy / dist, overlap: rSum - dist }
  }

  /** Normal points from the circle (`a`) toward the box (`b`). */
  private circleBox(
    circle: GameObject,
    cc: CircleCollider,
    box: GameObject,
    bc: BoxCollider,
  ): Contact | null {
    const hw = bc.width / 2
    const hh = bc.height / 2
    const minX = box.position.x - hw
    const maxX = box.position.x + hw
    const minY = box.position.y - hh
    const maxY = box.position.y + hh

    // Closest point on the box to the circle's center.
    const closestX = Math.min(Math.max(circle.position.x, minX), maxX)
    const closestY = Math.min(Math.max(circle.position.y, minY), maxY)
    const dx = circle.position.x - closestX
    const dy = circle.position.y - closestY
    const distSq = dx * dx + dy * dy
    if (distSq > cc.radius * cc.radius) return null

    if (distSq > 0) {
      const dist = Math.sqrt(distSq)
      // (dx, dy) points from box surface toward the circle; flip for circle->box.
      return { nx: -dx / dist, ny: -dy / dist, overlap: cc.radius - dist }
    }

    // Circle center is INSIDE the box: push out along the shallowest side.
    const pushLeft = circle.position.x - minX + cc.radius
    const pushRight = maxX - circle.position.x + cc.radius
    const pushUp = circle.position.y - minY + cc.radius
    const pushDown = maxY - circle.position.y + cc.radius
    const min = Math.min(pushLeft, pushRight, pushUp, pushDown)
    if (min === pushLeft) return { nx: 1, ny: 0, overlap: pushLeft }
    if (min === pushRight) return { nx: -1, ny: 0, overlap: pushRight }
    if (min === pushUp) return { nx: 0, ny: 1, overlap: pushUp }
    return { nx: 0, ny: -1, overlap: pushDown }
  }

  private boxBox(
    a: GameObject,
    ca: BoxCollider,
    b: GameObject,
    cb: BoxCollider,
  ): Contact | null {
    const overlapX =
      Math.min(a.position.x + ca.width / 2, b.position.x + cb.width / 2) -
      Math.max(a.position.x - ca.width / 2, b.position.x - cb.width / 2)
    if (overlapX <= 0) return null
    const overlapY =
      Math.min(a.position.y + ca.height / 2, b.position.y + cb.height / 2) -
      Math.max(a.position.y - ca.height / 2, b.position.y - cb.height / 2)
    if (overlapY <= 0) return null

    // Separate along the axis of least penetration.
    if (overlapX < overlapY) {
      return { nx: a.position.x < b.position.x ? 1 : -1, ny: 0, overlap: overlapX }
    }
    return { nx: 0, ny: a.position.y < b.position.y ? 1 : -1, overlap: overlapY }
  }

  // ---- solid collision response -------------------------------------------

  /** Push the pair apart, then bounce their velocities along the normal. */
  private resolve(a: GameObject, b: GameObject, contact: Contact) {
    const invA = a.body && !a.body.isStatic ? 1 : 0
    const invB = b.body && !b.body.isStatic ? 1 : 0
    const invSum = invA + invB
    if (invSum === 0) return

    const { nx, ny, overlap } = contact

    // Positional correction: movable side(s) absorb the overlap.
    a.position.x -= nx * overlap * (invA / invSum)
    a.position.y -= ny * overlap * (invA / invSum)
    b.position.x += nx * overlap * (invB / invSum)
    b.position.y += ny * overlap * (invB / invSum)

    // Impulse: only if the pair is still approaching.
    const relX = (b.body?.velocity.x ?? 0) - (a.body?.velocity.x ?? 0)
    const relY = (b.body?.velocity.y ?? 0) - (a.body?.velocity.y ?? 0)
    const velAlongNormal = relX * nx + relY * ny
    if (velAlongNormal > 0) return

    const bounciness = Math.min(a.body?.bounciness ?? 1, b.body?.bounciness ?? 1)
    const impulse = (-(1 + bounciness) * velAlongNormal) / invSum

    if (a.body && invA) {
      a.body.velocity.x -= impulse * nx
      a.body.velocity.y -= impulse * ny
    }
    if (b.body && invB) {
      b.body.velocity.x += impulse * nx
      b.body.velocity.y += impulse * ny
    }
  }
}
