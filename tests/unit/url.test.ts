import { describe, expect, it } from 'vitest'
import { urlPublique } from '@/lib/url'

describe('urlPublique', () => {
  it('privilégie NEXTAUTH_URL et retire le slash final', () => {
    expect(urlPublique({ NEXTAUTH_URL: 'https://momentum.fr/', VERCEL_PROJECT_PRODUCTION_URL: 'x.vercel.app' })).toBe('https://momentum.fr')
  })

  it('se rabat sur l’URL de production Vercel', () => {
    expect(urlPublique({ VERCEL_PROJECT_PRODUCTION_URL: 'momentum-abc.vercel.app' })).toBe('https://momentum-abc.vercel.app')
  })

  it('utilise localhost en dernier recours', () => {
    expect(urlPublique({})).toBe('http://localhost:3000')
  })
})
