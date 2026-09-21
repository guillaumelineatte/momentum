import { afterAll, describe, expect, it, vi } from 'vitest'

// next/headers n'existe que dans le runtime Next.js ; seul ipClient() s'en sert.
vi.mock('next/headers', () => ({ headers: async () => new Headers() }))

import { prisma } from '@/lib/prisma'
import { consommerTentative, messageAttente, verifierLimites } from '@/lib/rate-limit'

// Test d'intégration : nécessite DATABASE_URL (branche Neon "dev", jamais la prod).
const PREFIXE = `test-vitest:${Date.now()}`

afterAll(async () => {
  await prisma.rateLimit.deleteMany({ where: { key: { startsWith: PREFIXE } } })
  await prisma.$disconnect()
})

describe('consommerTentative', () => {
  it('autorise jusqu’à la limite puis bloque', async () => {
    const cle = `${PREFIXE}:a`
    const config = { max: 3, fenetreSecondes: 60 }

    for (let i = 0; i < 3; i++) expect((await consommerTentative(cle, config)).autorise).toBe(true)

    const bloque = await consommerTentative(cle, config)
    expect(bloque.autorise).toBe(false)
    if (!bloque.autorise) {
      expect(bloque.reessayerDansSecondes).toBeGreaterThan(0)
      expect(bloque.reessayerDansSecondes).toBeLessThanOrEqual(60)
    }
  })

  it('isole les clés entre elles', async () => {
    const config = { max: 1, fenetreSecondes: 60 }
    await consommerTentative(`${PREFIXE}:b1`, config)
    expect((await consommerTentative(`${PREFIXE}:b1`, config)).autorise).toBe(false)
    expect((await consommerTentative(`${PREFIXE}:b2`, config)).autorise).toBe(true)
  })

  it('repart de zéro quand la fenêtre est écoulée', async () => {
    const cle = `${PREFIXE}:c`
    const config = { max: 1, fenetreSecondes: 60 }
    await consommerTentative(cle, config)
    expect((await consommerTentative(cle, config)).autorise).toBe(false)

    await prisma.rateLimit.update({ where: { key: cle }, data: { windowStart: new Date(Date.now() - 120_000) } })
    expect((await consommerTentative(cle, config)).autorise).toBe(true)
  })

  it('compte correctement des requêtes simultanées', async () => {
    const cle = `${PREFIXE}:d`
    const config = { max: 5, fenetreSecondes: 60 }
    const resultats = await Promise.all(Array.from({ length: 12 }, () => consommerTentative(cle, config)))
    expect(resultats.filter((r) => r.autorise)).toHaveLength(5)
  })
})

describe('verifierLimites', () => {
  it('bloque dès qu’une des limites est dépassée', async () => {
    const resultat = await verifierLimites([
      [`${PREFIXE}:e:large`, { max: 100, fenetreSecondes: 60 }],
      [`${PREFIXE}:e:strict`, { max: 0, fenetreSecondes: 60 }],
    ])
    expect(resultat.autorise).toBe(false)
  })
})

describe('messageAttente', () => {
  it('arrondit à la minute supérieure et accorde le pluriel', () => {
    expect(messageAttente(30)).toContain('1 minute.')
    expect(messageAttente(61)).toContain('2 minutes.')
  })
})
