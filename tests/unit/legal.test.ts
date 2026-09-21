import { describe, expect, it } from 'vitest'
import { A_COMPLETER, NOM_EDITEUR, identiteEditeur } from '@/lib/legal'

describe('identiteEditeur', () => {
  it('affiche le nom de l’éditeur et l’adresse de la boîte e-mail de l’application', () => {
    expect(identiteEditeur({ SMTP_USER: ' contact@exemple.fr ' })).toEqual({
      nom: NOM_EDITEUR,
      email: 'contact@exemple.fr',
      adresse: null,
    })
  })

  it('affiche « [à compléter] » pour le contact quand aucune boîte e-mail n’est configurée', () => {
    expect(identiteEditeur({}).email).toBe(A_COMPLETER)
    expect(identiteEditeur({ SMTP_USER: '  ' }).email).toBe(A_COMPLETER)
    expect(identiteEditeur({}).nom).toBe('Guillaume Linéatte') // jamais dépendant de l'environnement
  })
})
