<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

import GameBall from '@/game/components/GameBall.vue'
import GameWall from '@/game/components/GameWall.vue'
import GameWorld from '@/game/components/GameWorld.vue'
import TriggerZone from '@/game/components/TriggerZone.vue'

import type { GameObjectEventPayload } from '@/game/context'

/**
 * GAME LAB — the training playground.
 * ===================================
 * Everything here is event-driven. Nothing polls, nothing checks state
 * in a loop — gameplay is just handlers reacting to triggers:
 *
 *   - spawn      = push into `balls` (v-for mounts a component = spawn)
 *   - despawn    = filter out of `balls` (unmount = despawn)
 *   - collision  = @collision fires the frame two solids touch
 *   - sensors    = @trigger-enter / @trigger-exit on a TriggerZone
 *   - input      = plain DOM events (@click on the arena)
 *
 * EXERCISES (in rough order of difficulty):
 *   1. Coin collector — add a small TriggerZone 'coin'; on trigger-enter,
 *      hide it (v-if) and add points.
 *   2. Pop-a-ball — put @click on a ball's div and despawn it when clicked.
 *   3. Pong paddle — a GameWall with :x="paddleX", moved by @keydown
 *      (static walls stay prop-driven, so binding x to a ref just works).
 *   4. Lava floor — TriggerZone along the bottom that despawns any ball
 *      that touches it. Then keep score of survivors.
 *   5. Breakout — v-for a grid of GameWalls; on @collision remove that
 *      brick from the array. (Hint: pass the brick id through `data`...
 *      you'll need to turn the bricks into GameObjectBase or extend
 *      GameWall with a `data` prop. That's part of the exercise.)
 */

// interface SpawnedBall {
//   id: number
//   x: number
//   y: number
//   vx: number
//   color: string
// }

// const BALL_COLORS = ['#ff5252', '#40c4ff', '#ffab40', '#69f0ae', '#e040fb', '#fff176']

// let nextBallId = 1
// const balls = ref<SpawnedBall[]>([
//   { id: nextBallId++, x: 140, y: 60, vx: 180, color: '#ff5252' },
//   { id: nextBallId++, x: 640, y: 40, vx: -140, color: '#40c4ff' },
// ])

// const goals = ref(0)
// const platformHits = ref(0)
// const worldRef = ref<InstanceType<typeof GameWorld> | null>(null)

// /** Input is an event too: click anywhere in the arena to drop a ball there. */
// function spawnBall(event: MouseEvent) {
//   const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
//   balls.value.push({
//     id: nextBallId++,
//     x: event.clientX - rect.left,
//     y: event.clientY - rect.top,
//     vx: (Math.random() - 0.5) * 320,
//     color: BALL_COLORS[Math.floor(Math.random() * BALL_COLORS.length)] ?? '#ff5252',
//   })
// }

// /** Fires the frame a ball enters the goal zone: score it and despawn it. */
// function onGoal(payload: GameObjectEventPayload) {
//   if (payload.other.tag !== 'ball') return
//   goals.value++
//   const scoredId = payload.other.data as number
//   balls.value = balls.value.filter((ball) => ball.id !== scoredId)
// }
const playerX = ref(410)
const playerY = ref(440)
const playerWidth = ref(40)

const ballX = ref(410)
const ballY = ref(240)

const showHoney = ref(true)

function pagPislit(event: KeyboardEvent) {
  if (event.key == 'ArrowLeft') playerX.value -= 10
  if (event.key == 'ArrowRight') playerX.value += 10
  if (event.key == 'ArrowUp') playerY.value -= 10
  if (event.key == 'ArrowDown') playerY.value += 10
}

function naayBangga(payload: GameObjectEventPayload) {
  console.log(payload)
  if (payload.other.tag == 'honey') {
    honeyCounter.value++
    showHoney.value = false
    playerWidth.value *= 2
    ballX.value += 100
    ballY.value += 100
  }
}

const honeyCounter = ref(0)

onMounted(() => window.addEventListener('keydown', pagPislit))
onUnmounted(() => window.removeEventListener('keydown', pagPislit))
</script>

<template>
  <h1 style="color: black">Count honey: {{ honeyCounter }}</h1>
  <div class="game-lab">
    <GameWorld :width="820" :height="480" :gravity="0">
      <!-- <GameBall
        :key="`honey-${ballX} honey-${ballY}`"
        v-if="showHoney"
        :x="ballX"
        :y="ballY"
        tag="honey"
      /> -->
      <GameWall
        :key="`player-${playerWidth}`"
        class="pooh"
        :x="playerX"
        :y="playerY"
        :color="'#00000000'"
        :width="playerWidth"
        :height="50"
        tag="player"
        @collision="naayBangga"
      />
    </GameWorld>
  </div>
</template>

<style scoped>
.game-lab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px 0;
}
.pooh {
  background-image: url('https://variety.com/wp-content/uploads/2016/05/pooh.jpg?w=700');
  background-size: contain;
}
</style>
