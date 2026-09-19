'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { completeOnboardingAction } from './actions'
import type { ActionState } from '@/app/(auth)/actions'
import { OBJECTIFS } from '@/lib/validations/onboarding'
import { Portal } from '@/components/portal'

const CHAMPS_MENSURATIONS = [
  'tourTailleDepartCm',
  'tourHanchesDepartCm',
  'tourPoitrineDepartCm',
  'tourBrasDepartCm',
  'tourCuissesDepartCm',
  'tourMolletsDepartCm',
  'tourCouDepartCm',
] as const

export function OnboardingForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(completeOnboardingAction, undefined)
  const formRef = useRef<HTMLFormElement>(null)
  const [demanderConfirmation, setDemanderConfirmation] = useState(false)
  const confirmationDejaDonnee = useRef(false)

  // Remontage forcé à chaque nouvelle réponse serveur : React réinitialise les champs non
  // contrôlés après une action, même en cas d'erreur. On reprend donc la main nous-mêmes
  // via `defaultValue`/`defaultChecked` + `key`, pour ne vider que les champs fautifs.
  const [tentative, setTentative] = useState(0)
  useEffect(() => {
    if (state !== undefined) setTentative((n) => n + 1)
  }, [state])

  const erreurs = state?.fieldErrors ?? {}
  const valeurs = state?.values ?? {}
  const objectifsCoches = state?.arrayValues?.objectifs ?? []

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (confirmationDejaDonnee.current) return // l'utilisateur a déjà confirmé, on laisse partir

    const donnees = new FormData(event.currentTarget)
    const aucuneMensuration = CHAMPS_MENSURATIONS.every((champ) => !String(donnees.get(champ) ?? '').trim())

    if (aucuneMensuration) {
      event.preventDefault()
      setDemanderConfirmation(true)
    }
  }

  function confirmerEnvoiSansMensurations() {
    confirmationDejaDonnee.current = true
    setDemanderConfirmation(false)
    formRef.current?.requestSubmit()
  }

  return (
    <>
      <form ref={formRef} action={formAction} onSubmit={onSubmit} noValidate key={tentative}>
        {state?.error && <p className="form-error" role="alert">{state.error}</p>}

        <p className="onboarding-step">POINT DE DÉPART</p>
        <div className="form-row">
          <div className="form-field">
            <label htmlFor="tailleCm">Taille (cm)</label>
            <input className="form-input" id="tailleCm" name="tailleCm" type="number" inputMode="decimal" min={0} step="0.1" defaultValue={valeurs.tailleCm ?? ''} />
            {erreurs.tailleCm && <p className="field-error" role="alert">{erreurs.tailleCm}</p>}
          </div>
          <div className="form-field">
            <label htmlFor="poidsDepartKg">Poids (kg)</label>
            <input className="form-input" id="poidsDepartKg" name="poidsDepartKg" type="number" inputMode="decimal" min={0} step="0.1" defaultValue={valeurs.poidsDepartKg ?? ''} />
            {erreurs.poidsDepartKg && <p className="field-error" role="alert">{erreurs.poidsDepartKg}</p>}
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="dateNaissance">Date de naissance (optionnel)</label>
          <input
            className="form-input"
            id="dateNaissance"
            name="dateNaissance"
            type="date"
            min="1900-01-01"
            max={new Date().toISOString().slice(0, 10)}
            defaultValue={valeurs.dateNaissance ?? ''}
            aria-invalid={!!erreurs.dateNaissance}
          />
          {erreurs.dateNaissance && <p className="field-error" role="alert">{erreurs.dateNaissance}</p>}
        </div>

        <p className="form-section-title">Objectifs principaux</p>
        {erreurs.objectifs && <p className="field-error" role="alert" style={{ marginTop: 0 }}>{erreurs.objectifs}</p>}
        <div className="checkbox-grid">
          {OBJECTIFS.map((objectif) => (
            <label className="checkbox-card" key={objectif.value}>
              <input type="checkbox" name="objectifs" value={objectif.value} defaultChecked={objectifsCoches.includes(objectif.value)} />
              {objectif.label}
            </label>
          ))}
        </div>

        <p className="form-section-title">Mensurations de départ (optionnel)</p>
        <div className="form-row">
          <div className="form-field">
            <label htmlFor="tourTailleDepartCm">Tour de taille (cm)</label>
            <input className="form-input" id="tourTailleDepartCm" name="tourTailleDepartCm" type="number" inputMode="decimal" min={0} step="0.1" defaultValue={valeurs.tourTailleDepartCm ?? ''} />
          </div>
          <div className="form-field">
            <label htmlFor="tourHanchesDepartCm">Tour de hanches (cm)</label>
            <input className="form-input" id="tourHanchesDepartCm" name="tourHanchesDepartCm" type="number" inputMode="decimal" min={0} step="0.1" defaultValue={valeurs.tourHanchesDepartCm ?? ''} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-field">
            <label htmlFor="tourPoitrineDepartCm">Tour de poitrine (cm)</label>
            <input className="form-input" id="tourPoitrineDepartCm" name="tourPoitrineDepartCm" type="number" inputMode="decimal" min={0} step="0.1" defaultValue={valeurs.tourPoitrineDepartCm ?? ''} />
          </div>
          <div className="form-field">
            <label htmlFor="tourBrasDepartCm">Tour de bras (cm)</label>
            <input className="form-input" id="tourBrasDepartCm" name="tourBrasDepartCm" type="number" inputMode="decimal" min={0} step="0.1" defaultValue={valeurs.tourBrasDepartCm ?? ''} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-field">
            <label htmlFor="tourCuissesDepartCm">Tour de cuisses (cm)</label>
            <input className="form-input" id="tourCuissesDepartCm" name="tourCuissesDepartCm" type="number" inputMode="decimal" min={0} step="0.1" defaultValue={valeurs.tourCuissesDepartCm ?? ''} />
          </div>
          <div className="form-field">
            <label htmlFor="tourMolletsDepartCm">Tour de mollets (cm)</label>
            <input className="form-input" id="tourMolletsDepartCm" name="tourMolletsDepartCm" type="number" inputMode="decimal" min={0} step="0.1" defaultValue={valeurs.tourMolletsDepartCm ?? ''} />
          </div>
        </div>
        <div className="form-field">
          <label htmlFor="tourCouDepartCm">Tour de cou (cm)</label>
          <input className="form-input" id="tourCouDepartCm" name="tourCouDepartCm" type="number" inputMode="decimal" min={0} step="0.1" defaultValue={valeurs.tourCouDepartCm ?? ''} />
        </div>

        <button className="form-submit" type="submit" disabled={pending}>
          {pending ? 'Enregistrement…' : 'Commencer mon suivi'}
        </button>
      </form>

      {demanderConfirmation && (
        <Portal>
          <div className="confirm-backdrop" onClick={() => setDemanderConfirmation(false)}>
            <div className="confirm-card glass-card" onClick={(event) => event.stopPropagation()}>
              <h2 style={{ fontSize: 17, margin: '0 0 0' }}>Aucune mensuration renseignée</h2>
              <p>Tu pourras toujours les ajouter plus tard, mais ton point de départ sera moins précis. Continuer sans les remplir ?</p>
              <div className="confirm-actions">
                <button onClick={() => setDemanderConfirmation(false)}>Revenir en arrière</button>
                <button className="danger" onClick={confirmerEnvoiSansMensurations}>Continuer sans</button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  )
}
