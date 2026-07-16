<script setup lang="ts">
import { onMounted, provide } from 'vue'

import { useGameLoop } from '@/game/composables/useGameLoop'
import { WORLD_KEY } from '@/game/context'
import { World, type WorldEvent } from '@/game/engine/World'

/**
 * The arena. Owns the physics World, runs the frame loop, and provide()s
 * the world so any game object mounted inside the default slot can
 * register itself. Mounting a child = spawning it; unmounting = despawning.
 *
 * Also re-emits every world event, so you can listen globally:
 *   <GameWorld @collision="..." @trigger-enter="...">
 */
const props = withDefaults(
  defineProps<{
    width?: number
    height?: number
    /** Downward acceleration in px/s². ~900-1200 feels natural. */
    gravity?: number
    autoStart?: boolean
  }>(),
  { width: 800, height: 500, gravity: 900, autoStart: true },
)

const emit = defineEmits<{
  collision: [event: WorldEvent]
  'trigger-enter': [event: WorldEvent]
  'trigger-exit': [event: WorldEvent]
}>()

const world = new World(props.width, props.height, props.gravity)
provide(WORLD_KEY, world)

world.onAny((event) => {
  if (event.type === 'collision') emit('collision', event)
  else if (event.type === 'trigger-enter') emit('trigger-enter', event)
  else emit('trigger-exit', event)
})

const { isRunning, start, pause, toggle } = useGameLoop((dt) => world.step(dt))

onMounted(() => {
  if (props.autoStart) start()
})

defineExpose({ world, isRunning, start, pause, toggle })
</script>

<template>
  <div class="game-world" :style="{ width: `${width}px`, height: `${height}px` }">
    <slot />
    <div v-if="!isRunning" class="paused-badge">⏸ paused</div>
  </div>
</template>

<style scoped>
.game-world {
  position: relative;
  overflow: hidden;
  border-radius: 10px;
  border: 3px solid #37474f;
  background:
    radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.06), transparent 60%),
    linear-gradient(180deg, #1c2733 0%, #10171f 100%);
  cursor: crosshair;
  user-select: none;
}

.paused-badge {
  position: absolute;
  top: 10px;
  right: 12px;
  padding: 4px 10px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.6);
  color: #ffd54f;
  font-size: 0.8rem;
  pointer-events: none;
}
</style>
