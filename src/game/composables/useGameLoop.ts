import { onUnmounted, readonly, ref } from 'vue'

/**
 * A requestAnimationFrame loop that calls `tick(deltaSeconds)` every frame.
 * Delta time is clamped so a background tab doesn't produce one giant,
 * physics-exploding step when the user comes back.
 */
export function useGameLoop(tick: (dt: number) => void) {
  const isRunning = ref(false)
  let rafId = 0
  let lastTime = 0

  function frame(time: number) {
    const dt = Math.min((time - lastTime) / 1000, 1 / 30)
    lastTime = time
    tick(dt)
    rafId = requestAnimationFrame(frame)
  }

  function start() {
    if (isRunning.value) return
    isRunning.value = true
    lastTime = performance.now()
    rafId = requestAnimationFrame(frame)
  }

  function pause() {
    isRunning.value = false
    cancelAnimationFrame(rafId)
  }

  function toggle() {
    if (isRunning.value) pause()
    else start()
  }

  onUnmounted(pause)

  return { isRunning: readonly(isRunning), start, pause, toggle }
}
