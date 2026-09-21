'use client'

import { useActionState } from 'react'
import { supprimerCompteAction } from './actions'
import type { ActionState } from '@/app/(auth)/actions'

export function SupprimerForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(supprimerCompteAction, undefined)

  return (
    <form action={formAction} noValidate>
      {state?.error && <p className="form-error" role="alert">{state.error}</p>}

      <div className="form-field">
        <label htmlFor="password">Ton mot de passe</label>
        <input className="form-input" id="password" name="password" type="password" autoComplete="current-password" />
      </div>

      <div className="form-field">
        <label className="consent-row" htmlFor="confirmation">
          <input type="checkbox" id="confirmation" name="confirmation" />
          <span>Je comprends que la suppression est immédiate et définitive.</span>
        </label>
      </div>

      <button className="form-submit form-submit-danger" type="submit" disabled={pending}>
        {pending ? 'Suppression…' : 'Supprimer définitivement mon compte'}
      </button>
    </form>
  )
}
