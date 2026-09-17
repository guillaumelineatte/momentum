'use client'

import { useActionState } from 'react'
import { creerCardioAction } from '../../actions'
import type { ActionState } from '@/app/(auth)/actions'
import { TYPES_CARDIO } from '@/lib/validations/activites'

export function CardioForm({ date }: { date: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(creerCardioAction, undefined)

  return (
    <form action={formAction} noValidate>
      <input type="hidden" name="date" value={date} />

      {state?.error && <p className="form-error" role="alert">{state.error}</p>}

      <div className="form-field">
        <label htmlFor="type">Type de séance</label>
        <select className="form-select" id="type" name="type" defaultValue="FOOTING" required>
          {TYPES_CARDIO.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="distanceKm">Distance (km)</label>
          <input className="form-input" id="distanceKm" name="distanceKm" type="number" inputMode="decimal" min={0} step="0.01" />
        </div>
        <div className="form-field">
          <label htmlFor="dureeMinutes">Durée (min)</label>
          <input className="form-input" id="dureeMinutes" name="dureeMinutes" type="number" inputMode="decimal" min={0} step="1" required />
        </div>
      </div>

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="deniveleM">Dénivelé (m)</label>
          <input className="form-input" id="deniveleM" name="deniveleM" type="number" inputMode="numeric" min={0} step="1" />
        </div>
        <div className="form-field">
          <label htmlFor="frequenceCardiaqueMoyenne">FC moyenne (bpm)</label>
          <input className="form-input" id="frequenceCardiaqueMoyenne" name="frequenceCardiaqueMoyenne" type="number" inputMode="numeric" min={0} step="1" />
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="ressenti">Ressenti (1 à 5)</label>
        <select className="form-select" id="ressenti" name="ressenti" defaultValue="">
          <option value="">—</option>
          {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="note">Note (optionnel)</label>
        <input className="form-input" id="note" name="note" type="text" maxLength={500} />
      </div>

      <button className="form-submit" type="submit" disabled={pending}>
        {pending ? 'Enregistrement…' : 'Enregistrer la séance'}
      </button>
    </form>
  )
}
