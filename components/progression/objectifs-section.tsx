import Link from 'next/link'
import { Plus, Trophy } from 'lucide-react'
import type { ObjectifAvecProgression } from '@/lib/data/objectifs'
import { SupprimerObjectifButton } from './supprimer-objectif-button'

export function ObjectifsSection({ objectifs }: { objectifs: ObjectifAvecProgression[] }) {
  return (
    <div className="goal-cards-grid">
      {objectifs.length === 0 && (
        <div className="empty-state">Aucun objectif pour l’instant — fixe-toi une cible pour suivre ta progression.</div>
      )}
      {objectifs.map((o) => (
        <article className={`goal-progress-card glass-card ${o.atteint ? 'atteint' : ''}`} key={o.id}>
          <div className="top">
            <div>
              <strong>{o.titre}</strong>
              <small>{o.atteint ? 'Objectif atteint 🎉' : `${o.progressionPct}% atteint`}</small>
            </div>
            {o.atteint ? <Trophy size={18} className="gold-icon" /> : <SupprimerObjectifButton id={o.id} titre={o.titre} />}
          </div>
          <div className="goal-track"><i style={{ width: `${o.progressionPct}%` }} /></div>
          <div className="valeurs">
            <span>Actuel : <b>{o.valeurActuelle != null ? `${o.valeurActuelle} ${o.unite}` : '—'}</b></span>
            <span>Cible : <b>{o.valeurCible} {o.unite}</b></span>
          </div>
        </article>
      ))}
      <Link href="/objectifs/nouveau" className="add-activity glass-card" style={{ minHeight: 56 }}>
        <span className="plus-icon"><Plus size={18} /></span>
        <span><strong>Ajouter un objectif</strong><small>Poids, charge, distance…</small></span>
      </Link>
    </div>
  )
}
