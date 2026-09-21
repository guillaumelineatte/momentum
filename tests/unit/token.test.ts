import { describe, expect, it } from 'vitest'
import { hashToken } from '@/lib/token'

describe('hashToken', () => {
  it('est déterministe', () => {
    expect(hashToken('abc')).toBe(hashToken('abc'))
  })

  it('ne renvoie jamais le jeton en clair', () => {
    const jeton = 'a'.repeat(64)
    const hash = hashToken(jeton)
    expect(hash).not.toContain(jeton)
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
  })

  it('donne des empreintes différentes pour des jetons différents', () => {
    expect(hashToken('a')).not.toBe(hashToken('b'))
  })
})
