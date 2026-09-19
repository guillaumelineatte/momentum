'use client'

import { useActionState, useEffect, useState } from 'react'
import { modifierProfilAction } from './actions'
import type { ActionState } from '@/app/(auth)/actions'
import { OBJECTIFS } from '@/lib/validations/onboarding'

export function ModifierProfilForm({
  valeursInitiales,
}: {
  valeursInitiales: { prenom: string; tailleCm: string; dateNaissance: string; objectifs: string[] }
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(modifierProfilAction, undefined)

  // Remontage forcé à chaque nouvelle réponse serveur, pour appliquer les bonnes valeurs
  // par défaut après une erreur (même principe que les autres formulaires de l'app).
  const [tentative, setTentative] = useState(0)
  useEffect(() => {
    if (state !== undefined) setTentative((n) => n + 1)
  }, [state])

  const erreurs = state?.fieldErrors ?? {}
  const valeurs = state?.values ?? valeursInitiales
  const objectifsCoches = state?.arrayValues?.objectifs ?? valeursInitiales.objectifs

  return (
    <form action={formAction} noValidate key={tentative}>
      {state?.error && <p className="form-error" role="alert">{state.error}</p>}

      <div className="form-field">
        <label htmlFor="prenom">Prénom</label>
        <input className="form-input" id="prenom" name="prenom" type="text" maxLength={50} defaultValue={valeurs.prenom ?? ''} aria-invalid={!!erreurs.prenom} />
        {erreurs.prenom && <p className="field-error" role="alert">{erreurs.prenom}</p>}
      </div>

      <div className="form-field">
        <label htmlFor="tailleCm">Taille (cm)</label>
        <input className="form-input" id="tailleCm" name="tailleCm" type="number" inputMode="decimal" min={0} step="0.1" defaultValue={valeurs.tailleCm ?? ''} />
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

      <button className="form-submit" type="submit" disabled={pending}>
        {pending ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </form>
  )
}
