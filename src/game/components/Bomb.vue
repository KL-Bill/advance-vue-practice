<script setup lang="ts">
import { CircleCollider } from '../engine/Collider.ts'
import GameObjectBase from '../internal/GameObjectBase.vue'

const props = withDefaults(
  defineProps<{
    x: number
    y: number
    radius: number
    tag?: string
    rotation?: number
  }>(),
  { color: '#546e7a', rotation: 0 },
)

const collider = new CircleCollider(props.radius, true)
</script>

<template>
  <GameObjectBase :x="props.x" :y="props.y" :collider="collider" :tag="tag"></GameObjectBase>
</template>

<style scoped></style>
