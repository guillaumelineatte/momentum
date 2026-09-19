'use client'

import { useActionState, useState } from 'react'
import { creerObjectifAction } from '../actions'
import type { ActionState } from '@/app/(auth)/actions'
import { TYPES_OBJECTIF } from '@/lib/validations/objectifs'

export function NouvelObjectifForm({ exercices }: { exercices: { id: string; nom: string }[] }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(creerObjectifAction, undefined)
  const [type, setType] = useState<string>('POIDS')
  const erreurs = state?.fieldErrors ?? {}
  const infoType = TYPES_OBJECTIF.find((t) => t.value === type)!

  return (
    <form action={formAction} noValidate>
      {state?.error && <p className="form-error" role="alert">{state.error}</p>}

      <div className="form-field">
        <label htmlFor="type">Type d'objectif</label>
        <select className="form-select" id="type" name="type" value={type} onChange={(e) => setType(e.target.value)}>
          {TYPES_OBJECTIF.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {type === 'CHARGE_EXERCICE' && (
        <div className="form-field">
          <label htmlFor="exerciceId">Exercice</label>
          {exercices.length === 0 ? (
            <p className="form-hint">Enregistre d'abord une séance de musculation pour pouvoir viser un exercice précis.</p>
          ) : (
            <select className="form-select" id="exerciceId" name="exerciceId" aria-invalid={!!erreurs.exerciceId}>
              {exercices.map((e) => <option key={e.id} value={e.id}>{e.nom}</option>)}
            </select>
          )}
          {erreurs.exerciceId && <p className="field-error" role="alert">{erreurs.exerciceId}</p>}
        </div>
      )}

      <div className="form-field">
        <label htmlFor="titre">Nom de l'objectif</label>
        <input className="form-input" id="titre" name="titre" type="text" maxLength={80} placeholder="Ex. Perdre 5 kg avant l'été" aria-invalid={!!erreurs.titre} />
        {erreurs.titre && <p className="field-error" role="alert">{erreurs.titre}</p>}
      </div>

      <div className="form-field">
        <label htmlFor="valeurCible">Valeur cible ({infoType.unite})</label>
        <input className="form-input" id="valeurCible" name="valeurCible" type="number" inputMode="decimal" min={0} step="0.1" aria-invalid={!!erreurs.valeurCible} />
        {erreurs.valeurCible && <p className="field-error" role="alert">{erreurs.valeurCible}</p>}
      </div>

      <p className="form-hint" style={{ marginBottom: 16 }}>Ta valeur actuelle sera capturée automatiquement comme point de départ de cet objectif.</p>

      <button className="form-submit" type="submit" disabled={pending}>
        {pending ? 'Création…' : 'Créer l’objectif'}
      </button>
    </form>
  )
}
