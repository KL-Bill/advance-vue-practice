/** Minimal 2D vector. The engine mutates these in place every frame. */
export interface Vec2 {
  x: number
  y: number
}

export const vec2 = (x = 0, y = 0): Vec2 => ({ x, y })
