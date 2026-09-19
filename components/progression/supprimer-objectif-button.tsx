'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { supprimerObjectifAction } from '@/app/(app)/objectifs/actions'
import { Portal } from '@/components/portal'

export function SupprimerObjectifButton({ id, titre }: { id: string; titre: string }) {
  const [confirmer, setConfirmer] = useState(false)
  const [enCours, setEnCours] = useState(false)

  async function supprimer() {
    setEnCours(true)
    try {
      await supprimerObjectifAction(id)
    } finally {
      setEnCours(false)
      setConfirmer(false)
    }
  }

  return (
    <>
      <button className="more-button" aria-label={`Supprimer l'objectif ${titre}`} onClick={() => setConfirmer(true)}>
        <X size={15} />
      </button>
      {confirmer && (
        <Portal>
          <div className="confirm-backdrop" onClick={() => !enCours && setConfirmer(false)}>
            <div className="confirm-card glass-card" onClick={(e) => e.stopPropagation()}>
              <h2 style={{ fontSize: 16, margin: 0 }}>Supprimer « {titre} » ?</h2>
              <p>Cette action est irréversible.</p>
              <div className="confirm-actions">
                <button onClick={() => setConfirmer(false)} disabled={enCours}>Annuler</button>
                <button className="danger" onClick={supprimer} disabled={enCours}>{enCours ? 'Suppression…' : 'Supprimer'}</button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  )
}
