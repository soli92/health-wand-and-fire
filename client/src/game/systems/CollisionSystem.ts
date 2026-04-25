/**
 * CollisionSystem — AABB collision detection between game entities.
 * Pure TS, no React dependency.
 */

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

/** Returns true if two axis-aligned bounding boxes overlap */
export function rectsOverlap(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  )
}

export interface CollisionResult {
  /** Indexes of player spells that hit enemies (to remove) */
  playerSpellHits: Set<number>
  /** Indexes of enemies that were killed */
  enemyKills: Set<number>
  /** Indexes of enemy spells that hit the player (to remove) */
  enemySpellHits: Set<number>
  /** Whether the player was hit by an enemy spell this frame */
  playerWasHit: boolean
  /** Score gained this frame */
  scoreGained: number
  /** Number of hits registered (for accuracy tracking) */
  hitsRegistered: number
}

export interface CollidableEnemy extends Rect {
  isDead: boolean
  hit(dmg?: number): boolean
}

export interface CollidableSpell extends Rect {
  isPlayerBullet: boolean
}

export interface CollidablePlayer extends Rect {
  isInvincible: boolean
  takeHit(): boolean
}

const SCORE_PER_KILL = 100

/**
 * Runs all collision checks for one game tick.
 *
 * @param player   - Wizard entity
 * @param enemies  - Active DarkCreature array
 * @param spells   - All active Spell projectiles (player + enemy)
 * @returns CollisionResult describing what happened this frame
 */
export function runCollisions(
  player: CollidablePlayer,
  enemies: CollidableEnemy[],
  spells: CollidableSpell[],
): CollisionResult {
  const result: CollisionResult = {
    playerSpellHits: new Set(),
    enemyKills: new Set(),
    enemySpellHits: new Set(),
    playerWasHit: false,
    scoreGained: 0,
    hitsRegistered: 0,
  }

  for (let si = 0; si < spells.length; si++) {
    const spell = spells[si]

    if (spell.isPlayerBullet) {
      // Player spell vs enemies
      for (let ei = 0; ei < enemies.length; ei++) {
        const enemy = enemies[ei]
        if (enemy.isDead) continue
        if (rectsOverlap(spell, enemy)) {
          result.playerSpellHits.add(si)
          result.hitsRegistered++
          const killed = enemy.hit(1)
          if (killed) {
            result.enemyKills.add(ei)
            result.scoreGained += SCORE_PER_KILL
          }
          break // one spell hits one enemy
        }
      }
    } else {
      // Enemy spell vs player
      if (!player.isInvincible && rectsOverlap(spell, player)) {
        result.enemySpellHits.add(si)
        const hit = player.takeHit()
        if (hit) result.playerWasHit = true
      }
    }
  }

  return result
}
