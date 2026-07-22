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
 *   1. integrates: RigidBody objects get gravity + velocity; bodiless
 *      objects glide by their own vx/vy (no gravity, no shoving)
 *   2. keeps moving objects inside the arena walls
 *   3. tests every pair of colliders for overlap
 *      - 'collide' vs 'collide' -> block/bounce, fire 'collision'
 *      - 'trigger' involved     -> no blocking, fire 'trigger-enter'/'exit'
 *
 * WHO YIELDS ON IMPACT — one rule:
 * - RigidBody objects yield: they get pushed, shoved, bounced (momentum).
 * - Bodiless objects never get shoved. When THEY move into a solid they
 *   are blocked, and their own velocity stops or rebounds per their
 *   `bounce` dial (0 = stop/slide, 1 = full rebound).
 *
 * Events fire on the FRAME THE CONTACT STARTS (and, for triggers, ends) —
 * not every frame of overlap.
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
  /** Where everything was at the end of last frame — detects position-driven movement. */
  private prevPositions = new Map<number, { x: number; y: number }>()

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
    this.prevPositions.delete(obj.id)
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

  // ---- lookups --------------------------------------------------------------

  /**
   * First LIVING object with this tag, or null. Works best when the tag is
   * unique (one 'player'); with duplicates you get whichever was added first.
   */
  find(tag: string): GameObject | null {
    for (const obj of this.objects.values()) {
      if (obj.alive && obj.tag === tag) return obj
    }
    return null
  }

  /** Every LIVING object with this tag. */
  findAll(tag: string): GameObject[] {
    const found: GameObject[] = []
    for (const obj of this.objects.values()) {
      if (obj.alive && obj.tag === tag) found.push(obj)
    }
    return found
  }

  /** Exact object by id — returns it even if killed (handy for revive()). */
  findById(id: number): GameObject | null {
    return this.objects.get(id) ?? null
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
    this.integrateRotation(dt)
    this.collideWalls()
    this.collidePairs()
    this.rememberPositions()
  }

  /** Move everything that has motion: bodies get gravity, bodiless get vx/vy. */
  private integrate(dt: number) {
    for (const obj of this.objects.values()) {
      if (!obj.alive) continue
      const body = obj.body
      if (body && !body.isStatic) {
        body.velocity.y += this.gravity * body.gravityScale * dt
        obj.position.x += body.velocity.x * dt
        obj.position.y += body.velocity.y * dt
      } else if (!body && (obj.vx !== 0 || obj.vy !== 0)) {
        // self-velocity: pure motion — no gravity, no momentum
        obj.position.x += obj.vx * dt
        obj.position.y += obj.vy * dt
      }
    }
  }

  /**
   * Spin toward any active rotateTo() target; free-spin (angularVelocity
   * set directly, no target) just keeps going forever. Runs for every
   * alive object, body or not — rotation is always visual-only.
   */
  private integrateRotation(dt: number) {
    for (const obj of this.objects.values()) {
      if (!obj.alive || obj.angularVelocity === 0) continue
      obj.rotation += obj.angularVelocity * dt
      if (obj.rotateTarget === null) continue

      const overshot =
        (obj.angularVelocity > 0 && obj.rotation >= obj.rotateTarget) ||
        (obj.angularVelocity < 0 && obj.rotation <= obj.rotateTarget)
      if (overshot) {
        obj.rotation = obj.rotateTarget
        obj.angularVelocity = 0
        obj.rotateTarget = null
      }
    }
  }

  /** Did this object move since the end of last frame (by ANY means)? */
  private hasMoved(obj: GameObject): boolean {
    const prev = this.prevPositions.get(obj.id)
    if (!prev) return true // first frame: treat as moving so spawn overlaps resolve
    return prev.x !== obj.position.x || prev.y !== obj.position.y
  }

  private rememberPositions() {
    for (const obj of this.objects.values()) {
      const prev = this.prevPositions.get(obj.id)
      if (prev) {
        prev.x = obj.position.x
        prev.y = obj.position.y
      } else {
        this.prevPositions.set(obj.id, { x: obj.position.x, y: obj.position.y })
      }
    }
  }

  private halfExtents(collider: AnyCollider): { hw: number; hh: number } {
    if (collider.shape === 'circle') return { hw: collider.radius, hh: collider.radius }
    return { hw: collider.width / 2, hh: collider.height / 2 }
  }

  /** Keep moving objects inside the arena, per their bounce setting. */
  private collideWalls() {
    for (const obj of this.objects.values()) {
      if (!obj.alive) continue
      const body = obj.body

      if (body && !body.isStatic) {
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
      } else if (!body && (obj.vx !== 0 || obj.vy !== 0)) {
        // self-velocity objects bounce off the arena edges per their dial
        const { hw, hh } = obj.collider ? this.halfExtents(obj.collider) : { hw: 0, hh: 0 }
        const pos = obj.position

        if (pos.x - hw < 0) {
          pos.x = hw
          if (obj.vx < 0) obj.vx = -obj.vx * obj.bounce
        } else if (pos.x + hw > this.width) {
          pos.x = this.width - hw
          if (obj.vx > 0) obj.vx = -obj.vx * obj.bounce
        }

        if (pos.y - hh < 0) {
          pos.y = hh
          if (obj.vy < 0) obj.vy = -obj.vy * obj.bounce
        } else if (pos.y + hh > this.height) {
          pos.y = this.height - hh
          if (obj.vy > 0) obj.vy = -obj.vy * obj.bounce
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
      if (!a || !a.alive || !a.collider) continue
      for (let j = i + 1; j < list.length; j++) {
        const b = list[j]
        if (!b || !b.alive || !b.collider) continue

        const isTriggerPair = a.collider.isTrigger || b.collider.isTrigger
        const aDynamic = !!a.body && !a.body.isStatic
        const bDynamic = !!b.body && !b.body.isStatic
        // Skip only if NOTHING here moves: no bodies AND neither side
        // changed position since last frame (by velocity OR direct writes).
        if (!isTriggerPair && !aDynamic && !bDynamic && !this.hasMoved(a) && !this.hasMoved(b))
          continue

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

  private boxBox(a: GameObject, ca: BoxCollider, b: GameObject, cb: BoxCollider): Contact | null {
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

  // ---- solid collision response ---------------------------------------------

  /**
   * Two branches, per the ownership rule:
   * - A dynamic RigidBody in the pair -> physics: the body absorbs the
   *   push-apart and the impulse (bodiless sides act as infinite mass, and
   *   their own speed counts, so a fast-moving paddle shoves hard).
   * - No dynamic bodies -> arcade: whichever side is MOVING gets pushed
   *   back out and its self-velocity stops or rebounds per its `bounce`.
   */
  private resolve(a: GameObject, b: GameObject, contact: Contact) {
    const { nx, ny, overlap } = contact
    const aDynamic = !!a.body && !a.body.isStatic
    const bDynamic = !!b.body && !b.body.isStatic

    if (aDynamic || bDynamic) {
      const invA = aDynamic ? 1 : 0
      const invB = bDynamic ? 1 : 0
      const invSum = invA + invB

      // Positional correction: only bodies yield.
      a.position.x -= nx * overlap * (invA / invSum)
      a.position.y -= ny * overlap * (invA / invSum)
      b.position.x += nx * overlap * (invB / invSum)
      b.position.y += ny * overlap * (invB / invSum)

      // Relative velocity includes bodiless self-velocity: moving paddles shove.
      const avx = a.body ? a.body.velocity.x : a.vx
      const avy = a.body ? a.body.velocity.y : a.vy
      const bvx = b.body ? b.body.velocity.x : b.vx
      const bvy = b.body ? b.body.velocity.y : b.vy
      const velAlongNormal = (bvx - avx) * nx + (bvy - avy) * ny
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
      return
    }

    // Arcade branch: bodiless vs bodiless. Moving side(s) get blocked.
    const aMoving = a.vx !== 0 || a.vy !== 0 || this.hasMoved(a)
    const bMoving = b.vx !== 0 || b.vy !== 0 || this.hasMoved(b)
    const wA = aMoving ? 1 : 0
    const wB = bMoving ? 1 : 0
    const wSum = wA + wB
    if (wSum === 0) return

    a.position.x -= nx * overlap * (wA / wSum)
    a.position.y -= ny * overlap * (wA / wSum)
    b.position.x += nx * overlap * (wB / wSum)
    b.position.y += ny * overlap * (wB / wSum)

    // Each moving side reacts with its OWN velocity against the surface:
    // bounce 0 -> the into-the-wall component dies (stop/slide),
    // bounce 1 -> it flips (full rebound).
    if (aMoving) {
      const vn = a.vx * nx + a.vy * ny // component of a's motion toward b
      if (vn > 0) {
        const factor = 1 + a.bounce
        a.vx -= factor * vn * nx
        a.vy -= factor * vn * ny
      }
    }
    if (bMoving) {
      const vn = b.vx * -nx + b.vy * -ny // component of b's motion toward a
      if (vn > 0) {
        const factor = 1 + b.bounce
        b.vx -= factor * vn * -nx
        b.vy -= factor * vn * -ny
      }
    }
  }
}
