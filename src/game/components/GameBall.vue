<script setup lang="ts">
import GameObjectBase from '@/game/components/GameObjectBase.vue'
import { CircleCollider } from '@/game/engine/Collider'
import { RigidBody } from '@/game/engine/RigidBody'

/**
 * Prefab: a circle with a rigidbody. Drop it in a <GameWorld> and it falls,
 * bounces, and collides. Listeners fall through to the base object, so
 * `<GameBall @collision="...">` just works.
 *
 * x/y/vx/vy are the SPAWN state — once alive, physics owns the ball.
 */
const props = withDefaults(
  defineProps<{
    x: number
    y: number
    radius?: number
    color?: string
    bounciness?: number
    gravityScale?: number
    vx?: number
    vy?: number
    tag?: string
    data?: unknown
  }>(),
  {
    radius: 16,
    color: '#ff5252',
    bounciness: 0.75,
    gravityScale: 1,
    vx: 0,
    vy: 0,
    tag: 'ball',
  },
)

const body = new RigidBody({
  vx: props.vx,
  vy: props.vy,
  gravityScale: props.gravityScale,
  bounciness: props.bounciness,
})
const collider = new CircleCollider(props.radius)
</script>

<template>
  <GameObjectBase :x="x" :y="y" :tag="tag" :body="body" :collider="collider" :data="data">
    <div class="ball" :style="{ background: color }"></div>
  </GameObjectBase>
</template>

<style scoped>
.ball {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  box-shadow:
    inset -5px -6px 10px rgba(0, 0, 0, 0.35),
    inset 4px 5px 8px rgba(255, 255, 255, 0.35);
}
</style>
