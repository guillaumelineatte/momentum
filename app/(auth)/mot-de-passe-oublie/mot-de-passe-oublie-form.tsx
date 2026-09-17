'use client'

import { useActionState } from 'react'
import { demandeReinitialisationAction, type ActionState } from '../actions'

export function MotDePasseOublieForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(demandeReinitialisationAction, undefined)

  return (
    <form action={formAction} noValidate>
      {state?.error && <p className="form-error" role="alert">{state.error}</p>}

      <div className="form-field">
        <label htmlFor="email">E-mail</label>
        <input className="form-input" id="email" name="email" type="email" autoComplete="email" inputMode="email" required />
      </div>

      <button className="form-submit" type="submit" disabled={pending}>
        {pending ? 'Envoi…' : 'Envoyer le lien de réinitialisation'}
      </button>
    </form>
  )
}
