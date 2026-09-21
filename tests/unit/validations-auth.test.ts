import { describe, expect, it } from 'vitest'
import { connexionSchema, inscriptionSchema } from '@/lib/validations/auth'

const inscriptionValide = {
  prenom: 'Alice',
  email: 'alice@example.com',
  password: 'motdepasse1',
  confirmPassword: 'motdepasse1',
}

describe('connexionSchema', () => {
  it('accepte un e-mail et un mot de passe', () => {
    expect(connexionSchema.safeParse({ email: 'a@b.fr', password: 'x' }).success).toBe(true)
  })

  it('refuse un e-mail invalide ou un mot de passe vide', () => {
    expect(connexionSchema.safeParse({ email: 'pas-un-email', password: 'x' }).success).toBe(false)
    expect(connexionSchema.safeParse({ email: 'a@b.fr', password: '' }).success).toBe(false)
  })
})

describe('inscriptionSchema', () => {
  it('accepte une inscription valide', () => {
    expect(inscriptionSchema.safeParse(inscriptionValide).success).toBe(true)
  })

  it('refuse un mot de passe de moins de 8 caractères', () => {
    expect(inscriptionSchema.safeParse({ ...inscriptionValide, password: 'court', confirmPassword: 'court' }).success).toBe(false)
  })

  it('refuse deux mots de passe différents', () => {
    const resultat = inscriptionSchema.safeParse({ ...inscriptionValide, confirmPassword: 'different1' })
    expect(resultat.success).toBe(false)
  })

  it('refuse un prénom vide ou trop long', () => {
    expect(inscriptionSchema.safeParse({ ...inscriptionValide, prenom: '  ' }).success).toBe(false)
    expect(inscriptionSchema.safeParse({ ...inscriptionValide, prenom: 'a'.repeat(51) }).success).toBe(false)
  })
})
