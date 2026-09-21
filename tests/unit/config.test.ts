import { describe, expect, it } from 'vitest'
import { verificationEmailRequise } from '@/lib/config'

describe('verificationEmailRequise', () => {
  it('est exigée par défaut, et seulement désactivée par « false »', () => {
    expect(verificationEmailRequise({})).toBe(true)
    expect(verificationEmailRequise({ REQUIRE_EMAIL_VERIFICATION: 'true' })).toBe(true)
    expect(verificationEmailRequise({ REQUIRE_EMAIL_VERIFICATION: '' })).toBe(true)
    expect(verificationEmailRequise({ REQUIRE_EMAIL_VERIFICATION: 'false' })).toBe(false)
  })
})
