'use client'

import { useActionState } from 'react'
import { connexionAction, type ActionState } from '../actions'

export function ConnexionForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(connexionAction, undefined)

  return (
    <form action={formAction} noValidate>
      {state?.error && <p className="form-error" role="alert">{state.error}</p>}

      <div className="form-field">
        <label htmlFor="email">E-mail</label>
        <input className="form-input" id="email" name="email" type="email" autoComplete="email" inputMode="email" required />
      </div>

      <div className="form-field">
        <label htmlFor="password">Mot de passe</label>
        <input className="form-input" id="password" name="password" type="password" autoComplete="current-password" required />
      </div>

      <button className="form-submit" type="submit" disabled={pending}>
        {pending ? 'Connexion…' : 'Se connecter'}
      </button>
    </form>
  )
}
