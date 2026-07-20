import { onMounted } from 'vue'

/**
 * Unity's Start(), for a page. Runs your callback exactly once:
 * - AFTER the world and every object in the template exist
 *   (children mount before the parent's hook fires), and
 * - BEFORE the first useUpdate frame
 *   (mounted hooks always run before the first animation frame).
 *
 * The natural home for initialization — find() your objects, set
 * starting velocities, serve the first ball:
 *
 *   useStart(() => {
 *     player = worldRef.value?.world.find('player') ?? null
 *   })
 */
export function useStart(start: () => void) {
  onMounted(start)
}
