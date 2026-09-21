import { describe, expect, it } from 'vitest'
import { DATE_MISE_A_JOUR, EDITEUR } from '@/lib/legal'

describe('identité de l’éditeur', () => {
  it('est renseignée : aucun texte à compléter ne doit atteindre une page publique', () => {
    expect(EDITEUR.nom.trim()).not.toBe('')
    expect(EDITEUR.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
    expect(JSON.stringify(EDITEUR) + DATE_MISE_A_JOUR).not.toMatch(/à compléter|\[|\]/i)
  })
})
