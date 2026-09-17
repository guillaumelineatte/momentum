'use client'

import { useActionState, useEffect, useState } from 'react'
import { inscriptionAction, type ActionState } from '../actions'

export function InscriptionForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(inscriptionAction, undefined)

  // À chaque nouveau résultat du serveur, on force un remontage du formulaire (via `key`)
  // pour que les champs repartent exactement des valeurs qu'on veut : conservées pour ceux
  // qui étaient valides, vidées pour ceux en erreur (et toujours vidées pour les mots de passe).
  const [tentative, setTentative] = useState(0)
  useEffect(() => {
    if (state !== undefined) setTentative((n) => n + 1)
  }, [state])

  const erreurs = state?.fieldErrors ?? {}
  const valeurs = state?.values ?? {}

  return (
    <form action={formAction} noValidate key={tentative}>
      {state?.error && <p className="form-error" role="alert">{state.error}</p>}

      <div className="form-field">
        <label htmlFor="prenom">Prénom</label>
        <input
          className="form-input"
          id="prenom"
          name="prenom"
          type="text"
          autoComplete="given-name"
          maxLength={50}
          defaultValue={valeurs.prenom ?? ''}
          aria-invalid={!!erreurs.prenom}
        />
        {erreurs.prenom && <p className="field-error" role="alert">{erreurs.prenom}</p>}
      </div>

      <div className="form-field">
        <label htmlFor="email">E-mail</label>
        <input
          className="form-input"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          defaultValue={valeurs.email ?? ''}
          aria-invalid={!!erreurs.email}
        />
        {erreurs.email && <p className="field-error" role="alert">{erreurs.email}</p>}
      </div>

      <div className="form-field">
        <label htmlFor="password">Mot de passe</label>
        <input
          className="form-input"
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          aria-invalid={!!erreurs.password}
        />
        {erreurs.password ? (
          <p className="field-error" role="alert">{erreurs.password}</p>
        ) : (
          <span className="form-hint">8 caractères minimum</span>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
        <input
          className="form-input"
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          aria-invalid={!!erreurs.confirmPassword}
        />
        {erreurs.confirmPassword && <p className="field-error" role="alert">{erreurs.confirmPassword}</p>}
      </div>

      <button className="form-submit" type="submit" disabled={pending}>
        {pending ? 'Création…' : 'Créer mon compte'}
      </button>
    </form>
  )
}
