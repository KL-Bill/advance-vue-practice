<script setup lang="ts">
import GameObjectBase from '@/game/internal/GameObjectBase.vue'
import { CircleCollider } from '../engine/Collider'

const props = withDefaults(
  defineProps<{
    x: number
    y: number
    radius: number
    tag?: string
  }>(),
  {},
)

const collider = new CircleCollider(props.radius, true)
</script>
<template>
  <GameObjectBase class="coin" :x="x" :y="y" :tag="tag" :collider="collider">
    <img src="../../assets/images/coin.png" alt="" srcset="" />
  </GameObjectBase>
</template>
<style scoped>
.coin {
  border-radius: 100%;
}
img {
  width: 100%;
  height: 100%;
}
</style>
