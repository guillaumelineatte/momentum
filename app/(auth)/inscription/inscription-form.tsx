'use client'

import { useActionState } from 'react'
import { inscriptionAction, type ActionState } from '../actions'

export function InscriptionForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(inscriptionAction, undefined)

  return (
    <form action={formAction} noValidate>
      {state?.error && <p className="form-error" role="alert">{state.error}</p>}

      <div className="form-field">
        <label htmlFor="prenom">Prénom</label>
        <input className="form-input" id="prenom" name="prenom" type="text" autoComplete="given-name" required maxLength={50} />
      </div>

      <div className="form-field">
        <label htmlFor="email">E-mail</label>
        <input className="form-input" id="email" name="email" type="email" autoComplete="email" inputMode="email" required />
      </div>

      <div className="form-field">
        <label htmlFor="password">Mot de passe</label>
        <input className="form-input" id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
        <span className="form-hint">8 caractères minimum</span>
      </div>

      <div className="form-field">
        <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
        <input className="form-input" id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required />
      </div>

      <button className="form-submit" type="submit" disabled={pending}>
        {pending ? 'Création…' : 'Créer mon compte'}
      </button>
    </form>
  )
}
