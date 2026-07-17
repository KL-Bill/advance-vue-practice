<script setup lang="ts">
import GameObjectBase from '@/game/internal/GameObjectBase.vue'
import { BoxCollider } from '@/game/engine/Collider'

const props = withDefaults(
  defineProps<{
    x: number
    y: number
    width: number
    height: number
    color?: string
    tag?: string
    rotation?: number
  }>(),
  { color: '#546e7a', rotation: 0 },
)

const collider = new BoxCollider(props.width, props.height)
</script>

<template>
  <GameObjectBase :x="x" :y="y" :tag="tag" :collider="collider" :rotation="rotation">
    <img src="../../assets/images/pacman.png" alt="" srcset="" width="100%" height="100%" />
  </GameObjectBase>
</template>

<style scoped></style>
