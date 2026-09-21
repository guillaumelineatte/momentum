'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { confirmerEmailAction, type ActionState } from '../actions'

export function ConfirmerForm({ email, token }: { email: string; token: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(confirmerEmailAction, undefined)

  return (
    <form action={formAction} noValidate>
      {state?.error && <p className="form-error" role="alert">{state.error}</p>}
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="token" value={token} />
      <button className="form-submit" type="submit" disabled={pending}>
        {pending ? 'Confirmation…' : 'Confirmer mon adresse'}
      </button>
      {state?.code === 'lien_invalide' && (
        <div className="auth-links">
          <Link href={`/inscription/confirmation?email=${encodeURIComponent(email)}`}>Recevoir un nouveau lien</Link>
        </div>
      )}
    </form>
  )
}
