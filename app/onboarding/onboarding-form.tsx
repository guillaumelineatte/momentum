'use client'

import { useActionState } from 'react'
import { completeOnboardingAction } from './actions'
import type { ActionState } from '@/app/(auth)/actions'
import { OBJECTIFS } from '@/lib/validations/onboarding'

export function OnboardingForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(completeOnboardingAction, undefined)

  return (
    <form action={formAction} noValidate>
      {state?.error && <p className="form-error" role="alert">{state.error}</p>}

      <p className="onboarding-step">POINT DE DÉPART</p>
      <div className="form-row">
        <div className="form-field">
          <label htmlFor="tailleCm">Taille (cm)</label>
          <input className="form-input" id="tailleCm" name="tailleCm" type="number" inputMode="decimal" min={0} step="0.1" />
        </div>
        <div className="form-field">
          <label htmlFor="poidsDepartKg">Poids (kg)</label>
          <input className="form-input" id="poidsDepartKg" name="poidsDepartKg" type="number" inputMode="decimal" min={0} step="0.1" />
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="dateNaissance">Date de naissance (optionnel)</label>
        <input className="form-input" id="dateNaissance" name="dateNaissance" type="date" />
      </div>

      <p className="form-section-title">Objectifs principaux</p>
      <div className="checkbox-grid">
        {OBJECTIFS.map((objectif) => (
          <label className="checkbox-card" key={objectif.value}>
            <input type="checkbox" name="objectifs" value={objectif.value} />
            {objectif.label}
          </label>
        ))}
      </div>

      <p className="form-section-title">Mensurations de départ (optionnel)</p>
      <div className="form-row">
        <div className="form-field">
          <label htmlFor="tourTailleDepartCm">Tour de taille (cm)</label>
          <input className="form-input" id="tourTailleDepartCm" name="tourTailleDepartCm" type="number" inputMode="decimal" min={0} step="0.1" />
        </div>
        <div className="form-field">
          <label htmlFor="tourHanchesDepartCm">Tour de hanches (cm)</label>
          <input className="form-input" id="tourHanchesDepartCm" name="tourHanchesDepartCm" type="number" inputMode="decimal" min={0} step="0.1" />
        </div>
      </div>
      <div className="form-row">
        <div className="form-field">
          <label htmlFor="tourPoitrineDepartCm">Tour de poitrine (cm)</label>
          <input className="form-input" id="tourPoitrineDepartCm" name="tourPoitrineDepartCm" type="number" inputMode="decimal" min={0} step="0.1" />
        </div>
        <div className="form-field">
          <label htmlFor="tourBrasDepartCm">Tour de bras (cm)</label>
          <input className="form-input" id="tourBrasDepartCm" name="tourBrasDepartCm" type="number" inputMode="decimal" min={0} step="0.1" />
        </div>
      </div>
      <div className="form-row">
        <div className="form-field">
          <label htmlFor="tourCuissesDepartCm">Tour de cuisses (cm)</label>
          <input className="form-input" id="tourCuissesDepartCm" name="tourCuissesDepartCm" type="number" inputMode="decimal" min={0} step="0.1" />
        </div>
        <div className="form-field">
          <label htmlFor="tourMolletsDepartCm">Tour de mollets (cm)</label>
          <input className="form-input" id="tourMolletsDepartCm" name="tourMolletsDepartCm" type="number" inputMode="decimal" min={0} step="0.1" />
        </div>
      </div>
      <div className="form-field">
        <label htmlFor="tourCouDepartCm">Tour de cou (cm)</label>
        <input className="form-input" id="tourCouDepartCm" name="tourCouDepartCm" type="number" inputMode="decimal" min={0} step="0.1" />
      </div>

      <button className="form-submit" type="submit" disabled={pending}>
        {pending ? 'Enregistrement…' : 'Commencer mon suivi'}
      </button>
    </form>
  )
}
