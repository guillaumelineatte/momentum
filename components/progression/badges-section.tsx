import { Sparkles, Flame, Footprints, Trophy, Target, Dumbbell, Award } from 'lucide-react'
import type { BadgeAffichage } from '@/lib/data/badges'
import { BadgeToast } from './badge-toast'

const ICONES: Record<string, typeof Sparkles> = { Sparkles, Flame, Footprints, Trophy, Target, Dumbbell }

export function BadgesSection({ badges }: { badges: BadgeAffichage[] }) {
  const nouveaux = badges.filter((b) => b.vientDetreDebloque)

  return (
    <>
      <div className="badges-grid">
        {badges.map((b) => {
          const Icone = ICONES[b.icone] ?? Award
          return (
            <article className={`badge-card glass-card ${b.debloque ? '' : 'verrouille'}`} key={b.cle}>
              <div className="icone"><Icone size={20} /></div>
              <strong>{b.nom}</strong>
              <span>{b.description}</span>
            </article>
          )
        })}
      </div>
      {nouveaux.map((b) => <BadgeToast key={b.cle} nom={b.nom} icone={b.icone} />)}
    </>
  )
}
