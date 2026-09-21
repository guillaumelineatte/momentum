import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { typeDeBase, verifierBaseCoherente } from '@/lib/garde-base'

// Hôtes fictifs : les vrais identifiants ne doivent jamais apparaître dans le dépôt.
const sha = (t: string) => createHash('sha256').update(t).digest('hex')
const EMPREINTES = { production: sha('ep-fake-prod-111'), dev: sha('ep-fake-dev-222') }
const url = (endpoint: string, pooler = true) =>
  `postgresql://user:secret@${endpoint}${pooler ? '-pooler' : ''}.c-5.eu-central-1.aws.neon.tech/neondb?sslmode=require`

const PROD = url('ep-fake-prod-111')
const DEV = url('ep-fake-dev-222')
const verif = (env: Record<string, string | undefined>) => () => verifierBaseCoherente(env, EMPREINTES)

describe('typeDeBase', () => {
  it('reconnaît production et dev, avec ou sans -pooler', () => {
    expect(typeDeBase(PROD, EMPREINTES)).toBe('production')
    expect(typeDeBase(url('ep-fake-prod-111', false), EMPREINTES)).toBe('production')
    expect(typeDeBase(DEV, EMPREINTES)).toBe('dev')
  })

  it('renvoie « inconnue » pour une autre base ou une URL invalide', () => {
    expect(typeDeBase(url('ep-autre-333'), EMPREINTES)).toBe('inconnue')
    expect(typeDeBase('pas une url', EMPREINTES)).toBe('inconnue')
  })
})

describe('verifierBaseCoherente', () => {
  it('accepte les combinaisons correctes', () => {
    expect(verif({ VERCEL_ENV: 'production', DATABASE_URL: PROD })).not.toThrow()
    expect(verif({ VERCEL_ENV: 'preview', DATABASE_URL: DEV })).not.toThrow()
    expect(verif({ DATABASE_URL: DEV })).not.toThrow() // local
  })

  it('bloque la production branchée sur la base dev', () => {
    expect(verif({ VERCEL_ENV: 'production', DATABASE_URL: DEV })).toThrow(/PRODUCTION.*base DEV/)
  })

  it('bloque une version de test branchée sur la production', () => {
    expect(verif({ VERCEL_ENV: 'preview', DATABASE_URL: PROD })).toThrow(/preview.*PRODUCTION/)
  })

  it('bloque un serveur local branché sur la production', () => {
    expect(verif({ DATABASE_URL: PROD })).toThrow(/local.*PRODUCTION/)
    expect(verif({ VERCEL_ENV: 'development', DATABASE_URL: PROD })).toThrow(/development.*PRODUCTION/)
  })

  it('laisse passer une base inconnue et l’absence de DATABASE_URL', () => {
    expect(verif({ VERCEL_ENV: 'production', DATABASE_URL: url('ep-autre-333') })).not.toThrow()
    expect(verif({ VERCEL_ENV: 'preview', DATABASE_URL: url('ep-autre-333') })).not.toThrow()
    expect(verif({ VERCEL_ENV: 'preview' })).not.toThrow()
  })

  it('ne divulgue jamais l’URL ni le mot de passe dans le message', () => {
    try {
      verifierBaseCoherente({ VERCEL_ENV: 'preview', DATABASE_URL: PROD }, EMPREINTES)
    } catch (e) {
      expect((e as Error).message).not.toMatch(/secret|ep-fake|neon\.tech/)
    }
  })
})
