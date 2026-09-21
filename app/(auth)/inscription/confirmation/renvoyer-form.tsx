'use client'

import { useActionState } from 'react'
import { renvoyerVerificationAction, type ActionState } from '../../actions'

export function RenvoyerForm({ email }: { email: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(renvoyerVerificationAction, undefined)

  return (
    <form action={formAction} noValidate>
      {state?.error && <p className="form-error" role="alert">{state.error}</p>}
      <input type="hidden" name="email" value={email} />
      <button className="form-submit" type="submit" disabled={pending}>
        {pending ? 'Envoi…' : 'Renvoyer l’e-mail'}
      </button>
    </form>
  )
}
