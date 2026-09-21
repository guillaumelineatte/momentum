import { describe, expect, it } from 'vitest'
import { urlPublique } from '@/lib/url'

describe('urlPublique', () => {
  it('privilégie NEXTAUTH_URL et retire le slash final', () => {
    expect(urlPublique({ NEXTAUTH_URL: 'https://momentum.fr/', VERCEL_ENV: 'production', VERCEL_PROJECT_PRODUCTION_URL: 'x.vercel.app' })).toBe('https://momentum.fr')
  })

  it('utilise l’URL de production Vercel en production', () => {
    expect(urlPublique({ VERCEL_ENV: 'production', VERCEL_PROJECT_PRODUCTION_URL: 'momentum.vercel.app', VERCEL_URL: 'momentum-abc.vercel.app' })).toBe('https://momentum.vercel.app')
  })

  it('utilise l’URL du déploiement en test, jamais celle de production', () => {
    const env = { VERCEL_ENV: 'preview', VERCEL_PROJECT_PRODUCTION_URL: 'momentum.vercel.app', VERCEL_URL: 'momentum-abc.vercel.app' }
    expect(urlPublique(env)).toBe('https://momentum-abc.vercel.app')
    expect(urlPublique({ ...env, VERCEL_BRANCH_URL: 'momentum-git-dev.vercel.app' })).toBe('https://momentum-git-dev.vercel.app')
  })

  it('utilise localhost en dernier recours', () => {
    expect(urlPublique({})).toBe('http://localhost:3000')
  })
})
