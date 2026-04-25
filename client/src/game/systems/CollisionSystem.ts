/**
 * CollisionSystem — AABB collision detection between game entities.
 * Mutates hp/lives directly and returns a summary result.
 */

import type { Wizard } from '../entities/Player'
import type { DarkCreature } from '../entities/Enemy'
import type { Spell } from '../entities/Bullet'

export interface CollisionResult {
  playerHits: number        // times player was struck by enemy bullets
  enemiesKilled: number     // enemies destroyed this frame
  livesLost: number         // lives the player actually lost (respects invincibility)
  scoreGained: number       // score delta from kills
}

/** AABB overlap test */
function overlaps(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number,
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by
}

/**
 * Check all relevant collisions in a single pass.
 *
 * @param player           The Wizard instance
 * @param enemies          Mutable array of DarkCreature — dead ones are spliced out
 * @param playerBullets    Mutable array of player Spells — spent ones are spliced out
 * @param enemyBullets     Mutable array of enemy Spells — spent ones are spliced out
 * @param scorePerKill     Score awarded per enemy kill (from WaveConfig)
 */
export function checkCollisions(
  player: Wizard,
  enemies: DarkCreature[],
  playerBullets: Spell[],
  enemyBullets: Spell[],
  scorePerKill: number = 100,
): CollisionResult {
  const result: CollisionResult = {
    playerHits: 0,
    enemiesKilled: 0,
    livesLost: 0,
    scoreGained: 0,
  }

  // --- Player bullets vs Enemies ---
  const bulletsToRemove = new Set<number>()
  const enemiesToRemove = new Set<number>()

  for (let bi = 0; bi < playerBullets.length; bi++) {
    const bullet = playerBullets[bi]
    for (let ei = 0; ei < enemies.length; ei++) {
      if (enemiesToRemove.has(ei)) continue
      const enemy = enemies[ei]
      if (overlaps(bullet.x, bullet.y, bullet.width, bullet.height,
                   enemy.x, enemy.y, enemy.width, enemy.height)) {
        bulletsToRemove.add(bi)
        const killed = enemy.hit(1)
        if (killed) {
          enemiesToRemove.add(ei)
          result.enemiesKilled++
          result.scoreGained += scorePerKill
        }
        break // one bullet hits one enemy
      }
    }
  }

  // Splice in reverse order to keep indices valid
  Array.from(bulletsToRemove).sort((a, b) => b - a).forEach(i => playerBullets.splice(i, 1))
  Array.from(enemiesToRemove).sort((a, b) => b - a).forEach(i => enemies.splice(i, 1))

  // --- Enemy bullets vs Player ---
  const enemyBulletsToRemove = new Set<number>()

  for (let bi = 0; bi < enemyBullets.length; bi++) {
    const bullet = enemyBullets[bi]
    if (overlaps(bullet.x, bullet.y, bullet.width, bullet.height,
                 player.x, player.y, player.width, player.height)) {
      enemyBulletsToRemove.add(bi)
      result.playerHits++
      const lifeActuallyLost = player.takeHit()
      if (lifeActuallyLost) result.livesLost++
    }
  }

  Array.from(enemyBulletsToRemove).sort((a, b) => b - a)
    .forEach(i => enemyBullets.splice(i, 1))

  // --- Enemies reaching player (body collision) ---
  for (let ei = enemies.length - 1; ei >= 0; ei--) {
    const enemy = enemies[ei]
    if (overlaps(enemy.x, enemy.y, enemy.width, enemy.height,
                 player.x, player.y, player.width, player.height)) {
      enemies.splice(ei, 1)
      result.enemiesKilled++
      const lifeActuallyLost = player.takeHit()
      if (lifeActuallyLost) result.livesLost++
    }
  }

  return result
}
