<script setup lang="ts">
import GameObjectBase from '@/game/components/GameObjectBase.vue'
import { BoxCollider } from '@/game/engine/Collider'

/**
 * Prefab: a static solid box. No rigidbody = immovable; things bounce
 * off it. Because it's static, it stays PROP-DRIVEN: bind :x / :y to a
 * ref and you have a keyboard paddle or a moving platform.
 */
const props = withDefaults(
  defineProps<{
    x: number
    y: number
    width: number
    height: number
    color?: string
    tag?: string
  }>(),
  { color: '#546e7a', tag: 'wall' },
)

const collider = new BoxCollider(props.width, props.height)
</script>

<template>
  <GameObjectBase :x="x" :y="y" :tag="tag" :collider="collider">
    <div class="wall" :style="{ background: color }"></div>
  </GameObjectBase>
</template>

<style scoped>
.wall {
  width: 100%;
  height: 100%;
  border-radius: 4px;
  /* box-shadow: inset 0 2px 0 rgba(255, 255, 255, 0.15); */
}
</style>
