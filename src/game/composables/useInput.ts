import { onMounted, onUnmounted, reactive } from 'vue'

/**
 * Keyboard state, Unity-style. Call it once in a page — it attaches and
 * cleans up the window listeners by itself.
 *
 *   const input = useInput()
 *
 *   input.isDown('ArrowLeft')            true WHILE held         (GetKey)
 *   input.wasPressed(' ')                true ONCE per press     (GetKeyDown)
 *   input.wasReleased(' ')               true ONCE per release   (GetKeyUp)
 *   input.axis('ArrowLeft','ArrowRight') -1 | 0 | 1              (GetAxis)
 *
 * Note: wasPressed / wasReleased CONSUME the event — the first call for a
 * key returns true, further calls return false until it happens again.
 * So check each key in one place per frame.
 */
export function useInput() {
  const down = reactive(new Set<string>())
  const pressed = reactive(new Set<string>())
  const released = reactive(new Set<string>())

  const onKeydown = (event: KeyboardEvent) => {
    if (!down.has(event.key)) pressed.add(event.key) // ignore OS auto-repeat
    down.add(event.key)
  }
  const onKeyup = (event: KeyboardEvent) => {
    down.delete(event.key)
    released.add(event.key)
  }
  const onBlur = () => {
    // tab lost focus: treat everything as released so no key gets stuck
    down.forEach((key) => released.add(key))
    down.clear()
    pressed.clear()
  }

  onMounted(() => {
    window.addEventListener('keydown', onKeydown)
    window.addEventListener('keyup', onKeyup)
    window.addEventListener('blur', onBlur)
  })
  onUnmounted(() => {
    window.removeEventListener('keydown', onKeydown)
    window.removeEventListener('keyup', onKeyup)
    window.removeEventListener('blur', onBlur)
  })

  return {
    /** True while the key is held. Key names: 'ArrowLeft', 'a', ' ', 'Enter'... */
    isDown: (key: string) => down.has(key),

    /** True exactly once per physical press. Ideal for jump, shoot, toggle. */
    wasPressed: (key: string) => pressed.delete(key),

    /** True exactly once per release. Ideal for "stop walking", charge shots. */
    wasReleased: (key: string) => released.delete(key),

    /** -1 when negKey held, +1 when posKey held, 0 for neither/both. */
    axis: (negKey: string, posKey: string) =>
      (down.has(posKey) ? 1 : 0) - (down.has(negKey) ? 1 : 0),
  }
}
