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
 * - every frame, the engine mutates `obj.position` and — because the
 *   object is wrapped in reactive() — Vue moves the div automatically
 * - world events involving THIS object are re-emitted as Vue events,
 *   so gameplay logic is written as plain @handlers
 */
const props = defineProps<{
  x: number
  y: number
  tag?: string
  body?: RigidBody | null
  collider?: AnyCollider | null
  data?: unknown
}>()

const emit = defineEmits<{
  collision: [payload: GameObjectEventPayload]
  'trigger-enter': [payload: GameObjectEventPayload]
  'trigger-exit': [payload: GameObjectEventPayload]
}>()

const world = inject(WORLD_KEY)
if (!world) throw new Error('<GameObjectBase> must be placed inside a <GameWorld>')

const obj = reactive(
  new GameObject({
    x: props.x,
    y: props.y,
    tag: props.tag ?? '',
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

// Objects WITHOUT a dynamic body (walls, zones, paddles) stay prop-driven:
// bind :x to a ref and changing the ref moves the object. Dynamic bodies
// belong to the physics engine after spawn, so prop changes are ignored.
watch(
  () => [props.x, props.y] as const,
  ([x, y]) => {
    if (obj.body && !obj.body.isStatic) return
    obj.position.x = x
    obj.position.y = y
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
    transform: `translate(${obj.position.x - w / 2}px, ${obj.position.y - h / 2}px)`,
  }
})

defineExpose({ obj })
</script>

<template>
  <div class="game-object" :style="style">
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
