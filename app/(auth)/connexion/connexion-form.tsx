'use client'

import Link from 'next/link'
import { useActionState, useEffect, useState } from 'react'
import { connexionAction, type ActionState } from '../actions'

export function ConnexionForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(connexionAction, undefined)

  // Remontage forcé du formulaire à chaque nouvelle réponse serveur, pour que le champ
  // e-mail reparte bien de la valeur qu'on veut lui redonner après une erreur.
  const [tentative, setTentative] = useState(0)
  useEffect(() => {
    if (state !== undefined) setTentative((n) => n + 1)
  }, [state])

  return (
    <form action={formAction} noValidate key={tentative}>
      {state?.error && <p className="form-error" role="alert">{state.error}</p>}
      {state?.code === 'email_non_verifie' && (
        <p className="form-hint">
          <Link href={`/inscription/confirmation?email=${encodeURIComponent(state.values?.email ?? '')}`}>Renvoyer l’e-mail de confirmation</Link>
        </p>
      )}

      <div className="form-field">
        <label htmlFor="email">E-mail</label>
        <input
          className="form-input"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          defaultValue={state?.values?.email ?? ''}
        />
      </div>

      <div className="form-field">
        <label htmlFor="password">Mot de passe</label>
        <input className="form-input" id="password" name="password" type="password" autoComplete="current-password" />
      </div>

      <button className="form-submit" type="submit" disabled={pending}>
        {pending ? 'Connexion…' : 'Se connecter'}
      </button>
    </form>
  )
}
