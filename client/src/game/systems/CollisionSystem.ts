/**
 * CollisionSystem — axis-aligned bounding box (AABB) collision detection.
 * Pure TS, no React dependency.
 */

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export class CollisionSystem {
  /**
   * Returns true if two rectangles overlap.
   */
  static aabb(a: Rect, b: Rect): boolean {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    )
  }

  /**
   * Checks whether a rect is fully outside canvas bounds.
   */
  static isOutOfBounds(rect: Rect, canvasW: number, canvasH: number): boolean {
    return (
      rect.x + rect.width < 0 ||
      rect.x > canvasW ||
      rect.y + rect.height < 0 ||
      rect.y > canvasH
    )
  }
}
