import { onMounted } from 'vue'

import { useGameLoop } from './useGameLoop'

/**
 * Unity's Update(), for a page. Runs your callback every frame with
 * dt = seconds since last frame (Time.deltaTime). Starts on mount,
 * stops on unmount — nothing to wire up.
 *
 *   useUpdate((dt) => {
 *     if (input.isDown('ArrowRight')) playerX.value += 300 * dt
 *   })
 */
export function useUpdate(update: (dt: number) => void) {
  const loop = useGameLoop(update)
  onMounted(loop.start)
  return loop // { isRunning, start, pause, toggle } if you ever need them
}
