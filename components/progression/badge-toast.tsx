'use client'

import { useEffect, useState } from 'react'
import { Sparkles, Flame, Footprints, Trophy, Target, Dumbbell, Award } from 'lucide-react'

const ICONES: Record<string, typeof Sparkles> = { Sparkles, Flame, Footprints, Trophy, Target, Dumbbell }

export function BadgeToast({ nom, icone }: { nom: string; icone: string }) {
  const [visible, setVisible] = useState(true)
  const Icone = ICONES[icone] ?? Award

  useEffect(() => {
    try { navigator.vibrate?.(100) } catch {}
    const id = window.setTimeout(() => setVisible(false), 5000)
    return () => window.clearTimeout(id)
  }, [])

  if (!visible) return null

  return (
    <div className="badge-toast">
      <div className="icone"><Icone size={19} /></div>
      <div>
        <strong>Badge débloqué !</strong>
        <span>{nom}</span>
      </div>
    </div>
  )
}
