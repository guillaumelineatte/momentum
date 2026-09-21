import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from '@/lib/password'

describe('mots de passe', () => {
  it('vérifie un mot de passe correct et refuse un incorrect', async () => {
    const hash = await hashPassword('mot-de-passe-solide')
    expect(hash).not.toContain('mot-de-passe-solide')
    expect(await verifyPassword('mot-de-passe-solide', hash)).toBe(true)
    expect(await verifyPassword('autre-chose', hash)).toBe(false)
  })
})
