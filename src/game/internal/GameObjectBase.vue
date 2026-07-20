<script setup lang="ts">
import { computed, inject, onUnmounted, reactive, watch } from 'vue'

import { WORLD_KEY, type GameObjectEventPayload } from '@/game/context'
import { GameObject } from '@/game/engine/GameObject'

import type { AnyCollider } from '@/game/engine/Collider'
import type { RigidBody } from '@/game/engine/RigidBody'

/**
 * The bridge between Vue and the engine. Any div you put in its slot
 * becomes a physical thing in the world:
 *
 * - on setup, it registers a GameObject with the injected World
 * - on unmount, it removes it (v-if / v-for splice = despawn)
 * - kill() on the object hides it and stops all its interactions
 * - world events involving THIS object are re-emitted as Vue events
 *
 * PROPS ARE SPAWN-ONLY. x/y (optional, default 0,0) place the object at
 * birth; after that, the object's own variables are the one way to move
 * it: `obj.position`, `obj.vx/vy`, `obj.applyImpulse(...)`. Get the
 * object from a template ref (defineExpose) or an event payload.
 */
const props = defineProps<{
  /** Spawn position — read once at birth. Defaults to 0, 0. */
  x?: number
  y?: number
  /** Visual rotation in degrees (clockwise). The hitbox does not rotate. */
  rotation?: number
  tag?: string
  /** Bodiless contact response: 0 = stop/slide (default), 1 = full rebound. */
  bounce?: number
  /** Self-velocity at spawn (bodiless objects only). */
  vx?: number
  vy?: number
  body?: RigidBody | null
  collider?: AnyCollider | null
  data?: unknown
}>()

const emit = defineEmits<{
  collision: [payload: GameObjectEventPayload]
  'trigger-enter': [payload: GameObjectEventPayload]
  'trigger-exit': [payload: GameObjectEventPayload]
  /** Fired once when the object is kill()ed. */
  destroyed: [self: GameObject]
}>()

const world = inject(WORLD_KEY)
if (!world) throw new Error('<GameObjectBase> must be placed inside a <GameWorld>')

// reactive() makes the engine's per-frame mutations drive Vue re-renders.
const obj = reactive(
  new GameObject({
    x: props.x ?? 0,
    y: props.y ?? 0,
    rotation: props.rotation ?? 0,
    tag: props.tag ?? '',
    bounce: props.bounce ?? 0,
    vx: props.vx ?? 0,
    vy: props.vy ?? 0,
    body: props.body ?? null,
    collider: props.collider ?? null,
    data: props.data,
  }),
) as GameObject

world.add(obj)

const stopListening = world.onObject(obj.id, (event) => {
  const other = event.a.id === obj.id ? event.b : event.a
  const payload: GameObjectEventPayload = { self: obj, other }
  if (event.type === 'collision') emit('collision', payload)
  else if (event.type === 'trigger-enter') emit('trigger-enter', payload)
  else emit('trigger-exit', payload)
})

onUnmounted(() => {
  stopListening()
  world.remove(obj)
})

// Rotation stays prop-driven (visual only — physics never writes it).
watch(
  () => props.rotation,
  (rotation) => {
    obj.rotation = rotation ?? 0
  },
)

// kill() -> tell the page, in case it wants to react (score, respawn...).
watch(
  () => obj.alive,
  (alive) => {
    if (!alive) emit('destroyed', obj)
  },
)

const style = computed(() => {
  const collider = obj.collider
  let w = 0
  let h = 0
  if (collider?.shape === 'circle') {
    w = collider.radius * 2
    h = w
  } else if (collider?.shape === 'box') {
    w = collider.width
    h = collider.height
  }
  return {
    width: `${w}px`,
    height: `${h}px`,
    transform: `translate(${obj.position.x - w / 2}px, ${obj.position.y - h / 2}px) rotate(${obj.rotation}deg)`,
  }
})

defineExpose({ obj })
</script>

<template>
  <div v-if="obj.alive" class="game-object" :style="style">
    <slot :obj="obj" />
  </div>
</template>

<style scoped>
.game-object {
  position: absolute;
  top: 0;
  left: 0;
  will-change: transform;
}
</style>
