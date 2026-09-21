import { describe, expect, it } from 'vitest'
import { A_COMPLETER, identiteEditeur } from '@/lib/legal'

describe('identiteEditeur', () => {
  it('lit l\u2019identité dans l\u2019environnement', () => {
    expect(identiteEditeur({ LEGAL_EDITOR_NAME: ' Alice Martin ', LEGAL_CONTACT_EMAIL: 'contact@ex.fr', LEGAL_EDITOR_ADDRESS: '1 rue X' })).toEqual({
      nom: 'Alice Martin',
      email: 'contact@ex.fr',
      adresse: '1 rue X',
    })
  })

  it('affiche « [à compléter] » quand une valeur est absente ou vide, et laisse l\u2019adresse facultative', () => {
    expect(identiteEditeur({})).toEqual({ nom: A_COMPLETER, email: A_COMPLETER, adresse: null })
    expect(identiteEditeur({ LEGAL_EDITOR_NAME: '  ', LEGAL_CONTACT_EMAIL: '' }).nom).toBe(A_COMPLETER)
  })
})
