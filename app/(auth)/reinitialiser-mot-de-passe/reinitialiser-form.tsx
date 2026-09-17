'use client'

import { useActionState } from 'react'
import { reinitialiserMotDePasseAction, type ActionState } from '../actions'

export function ReinitialiserForm({ token, email }: { token: string; email: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(reinitialiserMotDePasseAction, undefined)

  return (
    <form action={formAction} noValidate>
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="email" value={email} />

      {state?.error && <p className="form-error" role="alert">{state.error}</p>}

      <div className="form-field">
        <label htmlFor="password">Nouveau mot de passe</label>
        <input className="form-input" id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
        <span className="form-hint">8 caractères minimum</span>
      </div>

      <div className="form-field">
        <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
        <input className="form-input" id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required />
      </div>

      <button className="form-submit" type="submit" disabled={pending}>
        {pending ? 'Mise à jour…' : 'Choisir ce mot de passe'}
      </button>
    </form>
  )
}
