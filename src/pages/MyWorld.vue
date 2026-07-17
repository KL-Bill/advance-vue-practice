<script setup lang="ts">
import { useInput } from '@/game/composables/useInput'
import { useUpdate } from '@/game/composables/useUpdate'
import GameWorld from '@/game/engine/GameWorld.vue'
import { ref } from 'vue'

const input = useInput()

useUpdate((dt) => {})
</script>

<template>
  <GameWorld :width="800" :height="400" :gravity="0"> </GameWorld>
</template>
<style></style>
