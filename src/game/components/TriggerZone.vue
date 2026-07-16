<script setup lang="ts">
import GameObjectBase from '@/game/components/GameObjectBase.vue'
import { BoxCollider } from '@/game/engine/Collider'

/**
 * Prefab: an invisible sensor. Objects pass through it, but the moment a
 * rigidbody overlaps it you get @trigger-enter, and @trigger-exit when it
 * leaves. Goals, coins, checkpoints, lava — all of them are this component
 * plus a handler.
 */
const props = withDefaults(
  defineProps<{
    x: number
    y: number
    width: number
    height: number
    color?: string
    label?: string
    tag?: string
  }>(),
  { color: 'rgba(118, 255, 3, 0.12)', label: '', tag: 'zone' },
)

const collider = new BoxCollider(props.width, props.height, true)
</script>

<template>
  <GameObjectBase :x="x" :y="y" :tag="tag" :collider="collider">
    <div class="zone" :style="{ background: color }">
      <slot>{{ label }}</slot>
    </div>
  </GameObjectBase>
</template>

<style scoped>
.zone {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed rgba(118, 255, 3, 0.5);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}
</style>
