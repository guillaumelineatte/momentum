'use client'

import { useActionState, useState } from 'react'
import { demarrerSeanceAction } from '../actions'
import type { ActionState } from '@/app/(auth)/actions'
import { TYPES_SEANCE } from '@/lib/validations/musculation'

export function NouvelleSeanceForm({ date }: { date: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(demarrerSeanceAction, undefined)
  const [type, setType] = useState<string | null>(null)
  const erreurs = state?.fieldErrors ?? {}

  return (
    <form action={formAction} noValidate>
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="type" value={type ?? ''} />

      {erreurs.type && <p className="form-error" role="alert">{erreurs.type}</p>}

      <div className="seance-type-grid">
        {TYPES_SEANCE.map((t) => (
          <button
            key={t.value}
            type="button"
            className={`seance-type-card ${type === t.value ? 'selected' : ''}`}
            onClick={() => setType(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {type === 'PERSONNALISE' && (
        <div className="form-field">
          <label htmlFor="nomPersonnalise">Nom de la séance</label>
          <input
            className="form-input"
            id="nomPersonnalise"
            name="nomPersonnalise"
            type="text"
            placeholder="Ex. Bras, Dos-biceps, Circuit…"
            maxLength={60}
            autoFocus
          />
          {erreurs.nomPersonnalise && <p className="field-error" role="alert">{erreurs.nomPersonnalise}</p>}
        </div>
      )}

      <button className="form-submit" type="submit" disabled={pending || !type}>
        {pending ? 'Démarrage…' : 'Démarrer la séance'}
      </button>
    </form>
  )
}
