'use client'

import { useActionState } from 'react'
import { enregistrerSuiviQuotidienAction } from '../../actions'
import type { ActionState } from '@/app/(auth)/actions'

export function SuiviForm({ date, valeursInitiales }: { date: string; valeursInitiales?: Record<string, number | null> }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(enregistrerSuiviQuotidienAction, undefined)
  const v = valeursInitiales ?? {}

  return (
    <form action={formAction} noValidate>
      <input type="hidden" name="date" value={date} />

      {state?.error && <p className="form-error" role="alert">{state.error}</p>}

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="pas">Pas</label>
          <input className="form-input" id="pas" name="pas" type="number" inputMode="numeric" min={0} step="1" defaultValue={v.pas ?? undefined} />
        </div>
        <div className="form-field">
          <label htmlFor="sommeilHeures">Sommeil (heures)</label>
          <input className="form-input" id="sommeilHeures" name="sommeilHeures" type="number" inputMode="decimal" min={0} step="0.1" defaultValue={v.sommeilHeures ?? undefined} />
        </div>
      </div>

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="qualiteSommeil">Qualité du sommeil (1 à 5)</label>
          <select className="form-select" id="qualiteSommeil" name="qualiteSommeil" defaultValue={v.qualiteSommeil ?? ''}>
            <option value="">—</option>
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="energie">Énergie / humeur (1 à 5)</label>
          <select className="form-select" id="energie" name="energie" defaultValue={v.energie ?? ''}>
            <option value="">—</option>
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="proteinesG">Protéines (g)</label>
          <input className="form-input" id="proteinesG" name="proteinesG" type="number" inputMode="numeric" min={0} step="1" defaultValue={v.proteinesG ?? undefined} />
        </div>
        <div className="form-field">
          <label htmlFor="hydratationL">Hydratation (L)</label>
          <input className="form-input" id="hydratationL" name="hydratationL" type="number" inputMode="decimal" min={0} step="0.1" defaultValue={v.hydratationL ?? undefined} />
        </div>
      </div>

      <button className="form-submit" type="submit" disabled={pending}>
        {pending ? 'Enregistrement…' : 'Enregistrer le suivi du jour'}
      </button>
    </form>
  )
}
