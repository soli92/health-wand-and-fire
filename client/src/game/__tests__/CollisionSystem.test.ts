import { describe, expect, it } from 'vitest'
import {
  rectsOverlap,
  runCollisions,
  type CollidableEnemy,
  type CollidablePlayer,
  type CollidableSpell,
} from '../systems/CollisionSystem'

describe('rectsOverlap', () => {
  it('returns true when rectangles intersect', () => {
    expect(
      rectsOverlap(
        { x: 0, y: 0, width: 10, height: 10 },
        { x: 5, y: 5, width: 10, height: 10 },
      ),
    ).toBe(true)
  })

  it('returns false when separated', () => {
    expect(
      rectsOverlap(
        { x: 0, y: 0, width: 10, height: 10 },
        { x: 20, y: 20, width: 10, height: 10 },
      ),
    ).toBe(false)
  })
})

describe('runCollisions', () => {
  it('scores and marks kill when player spell overlaps dead-on enemy', () => {
    let hp = 1
    const enemy: CollidableEnemy = {
      x: 10,
      y: 10,
      width: 20,
      height: 20,
      isDead: false,
      hit: () => {
        hp -= 1
        return hp <= 0
      },
    }
    const player: CollidablePlayer = {
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      isInvincible: false,
      takeHit: () => false,
    }
    const spells: CollidableSpell[] = [
      { x: 15, y: 15, width: 4, height: 4, isPlayerBullet: true },
    ]

    const r = runCollisions(player, [enemy], spells)
    expect(r.playerSpellHits.has(0)).toBe(true)
    expect(r.enemyKills.has(0)).toBe(true)
    expect(r.hitsRegistered).toBe(1)
    expect(r.scoreGained).toBe(100)
  })

  it('does not hit player when invincible', () => {
    const player: CollidablePlayer = {
      x: 0,
      y: 0,
      width: 20,
      height: 20,
      isInvincible: true,
      takeHit: () => true,
    }
    const spells: CollidableSpell[] = [
      { x: 5, y: 5, width: 4, height: 4, isPlayerBullet: false },
    ]

    const r = runCollisions(player, [], spells)
    expect(r.enemySpellHits.size).toBe(0)
    expect(r.playerWasHit).toBe(false)
  })
})
