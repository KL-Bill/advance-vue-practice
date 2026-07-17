<script setup lang="ts">
import GameObjectBase from '@/game/internal/GameObjectBase.vue'
import { BoxCollider } from '@/game/engine/Collider'

const props = withDefaults(
  defineProps<{
    x: number
    y: number
    width: number
    height: number
    tag?: string
  }>(),
  {},
)

const collider = new BoxCollider(props.width, props.height, true)
</script>
<template>
  <GameObjectBase :x="x" :y="y" :tag="tag" :collider="collider">
    <div class="danger"></div>
  </GameObjectBase>
</template>
<style scoped>
.danger {
  width: 100%;
  height: 100%;
  background: crimson;
}
</style>
