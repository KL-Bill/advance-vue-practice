<script setup lang="ts">
import Bomb from '@/game/components/Bomb.vue'
import Coin from '@/game/components/Coin.vue'
import DangerWall from '@/game/components/DangerWall.vue'
import Player from '@/game/components/Player.vue'
import { useInput } from '@/game/composables/useInput'
import { useUpdate } from '@/game/composables/useUpdate'
import type { GameObjectEventPayload } from '@/game/context'
import GameWorld from '@/game/engine/GameWorld.vue'
import { ref } from 'vue'

const input = useInput()

const playerX = ref(300)
const playerY = ref(200)
const playerRotation = ref(0)

const coinX = ref(400)
const coinY = ref(100)
const showCoin = ref(false)

const speed = 200
const coinCount = ref(0)
const timeRemaining = ref(10)
let rotVal = 0

useUpdate((dt) => {
  if (input.isDown('ArrowRight')) {
    playerX.value += speed * dt
    rotVal = 360
  }
  if (input.isDown('ArrowLeft')) {
    playerX.value -= speed * dt
    rotVal = 180
  }
  if (input.isDown('ArrowUp')) {
    playerY.value -= speed * dt
    rotVal = -90 + (rotVal == 360 ? 45 : rotVal == 180 ? -45 : 0)
  }
  if (input.isDown('ArrowDown')) {
    playerY.value += speed * dt
    rotVal = 90 + (rotVal == 360 ? -45 : rotVal == 180 ? 45 : 0)
  }
  if (input.wasReleased('Enter')) {
    showCoin.value = true
    startTime()
  }

  playerRotation.value = rotVal
})

function startTime() {
  const counter = setInterval(() => {
    timeRemaining.value -= 1
    if (timeRemaining.value == 0) {
      clearInterval(counter)
      gameOver()
    }
  }, 1000)
}

function randomizeCoinPosition() {
  coinX.value = getRandomInt(800)
  coinY.value = getRandomInt(400)
}

function gameOver() {
  alert(`Game Over!\n You got ${coinCount.value} coins!`)
  playerX.value = 300
  playerY.value = 200
  coinCount.value = 0
  showCoin.value = false
}

function getRandomInt(max: number): number {
  return Math.floor(Math.random() * max)
}

const playerAlive = ref(true)

function playerTouchSomeone(payload: GameObjectEventPayload) {
  console.log(payload.other.tag)
  if (payload.other.tag == 'danger-wall') {
    gameOver()
  }

  if (payload.other.tag == 'coin') {
    coinCount.value++
    randomizeCoinPosition()
  }

  if (payload.other.tag == 'bomb') {
    playerAlive.value = false
    alert('Your dead!')
  }
}
</script>

<template>
  <GameWorld :width="800" :height="400" :gravity="0">
    <h1>Coins: {{ coinCount }}</h1>
    <h1>Time remaining: {{ timeRemaining }}</h1>
    <Coin v-if="showCoin" :x="coinX" :y="coinY" :radius="15" tag="coin" />

    <Bomb class="bomb" :x="400" :y="200" :radius="15" tag="bomb" />

    <Player
      v-if="playerAlive"
      :rotation="playerRotation"
      :x="playerX"
      :y="playerY"
      :width="50"
      :height="50"
      :color="'#e9d45c'"
      @trigger-enter="playerTouchSomeone"
      tag="player"
    />
    <!-- <GameWall :x="298" :y="380" :height="10" :width="600" tag="wall" /> -->
    <!-- <DangerWall :x="400" :y="380" :height="10" :width="800" tag="danger-wall" /> -->
  </GameWorld>
</template>
<style>
.bomb {
  background-color: black;
  border-radius: 100%;
}
</style>
