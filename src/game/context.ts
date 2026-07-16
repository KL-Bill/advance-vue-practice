import type { InjectionKey } from 'vue'

import type { GameObject } from '@/game/engine/GameObject'
import type { World } from '@/game/engine/World'

/** How <GameWorld> hands its World to every object nested inside it. */
export const WORLD_KEY: InjectionKey<World> = Symbol('game-world')

/**
 * Payload of the events a game object component emits
 * (@collision, @trigger-enter, @trigger-exit).
 */
export interface GameObjectEventPayload {
  /** The object that emitted the event. */
  self: GameObject
  /** The object it touched. Check `other.tag` / `other.data` to react. */
  other: GameObject
}
