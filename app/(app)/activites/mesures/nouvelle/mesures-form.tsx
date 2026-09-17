'use client'

import { useActionState } from 'react'
import { creerMesuresAction } from '../../actions'
import type { ActionState } from '@/app/(auth)/actions'

export function MesuresForm({ date }: { date: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(creerMesuresAction, undefined)

  return (
    <form action={formAction} noValidate>
      <input type="hidden" name="date" value={date} />

      {state?.error && <p className="form-error" role="alert">{state.error}</p>}
      <p className="form-hint" style={{ marginBottom: 16 }}>Tous les champs sont optionnels — renseigne ce que tu as mesuré.</p>

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="poidsKg">Poids (kg)</label>
          <input className="form-input" id="poidsKg" name="poidsKg" type="number" inputMode="decimal" min={0} step="0.1" />
        </div>
        <div className="form-field">
          <label htmlFor="masseGrassePct">Masse grasse (%)</label>
          <input className="form-input" id="masseGrassePct" name="masseGrassePct" type="number" inputMode="decimal" min={0} step="0.1" />
        </div>
      </div>
      <div className="form-row">
        <div className="form-field">
          <label htmlFor="tourTailleCm">Tour de taille (cm)</label>
          <input className="form-input" id="tourTailleCm" name="tourTailleCm" type="number" inputMode="decimal" min={0} step="0.1" />
        </div>
        <div className="form-field">
          <label htmlFor="tourHanchesCm">Tour de hanches (cm)</label>
          <input className="form-input" id="tourHanchesCm" name="tourHanchesCm" type="number" inputMode="decimal" min={0} step="0.1" />
        </div>
      </div>
      <div className="form-row">
        <div className="form-field">
          <label htmlFor="tourPoitrineCm">Tour de poitrine (cm)</label>
          <input className="form-input" id="tourPoitrineCm" name="tourPoitrineCm" type="number" inputMode="decimal" min={0} step="0.1" />
        </div>
        <div className="form-field">
          <label htmlFor="tourBrasCm">Tour de bras (cm)</label>
          <input className="form-input" id="tourBrasCm" name="tourBrasCm" type="number" inputMode="decimal" min={0} step="0.1" />
        </div>
      </div>
      <div className="form-row">
        <div className="form-field">
          <label htmlFor="tourCuissesCm">Tour de cuisses (cm)</label>
          <input className="form-input" id="tourCuissesCm" name="tourCuissesCm" type="number" inputMode="decimal" min={0} step="0.1" />
        </div>
        <div className="form-field">
          <label htmlFor="tourMolletsCm">Tour de mollets (cm)</label>
          <input className="form-input" id="tourMolletsCm" name="tourMolletsCm" type="number" inputMode="decimal" min={0} step="0.1" />
        </div>
      </div>
      <div className="form-field">
        <label htmlFor="tourCouCm">Tour de cou (cm)</label>
        <input className="form-input" id="tourCouCm" name="tourCouCm" type="number" inputMode="decimal" min={0} step="0.1" />
      </div>

      <button className="form-submit" type="submit" disabled={pending}>
        {pending ? 'Enregistrement…' : 'Enregistrer les mesures'}
      </button>
    </form>
  )
}
