import Link from 'next/link'
import { BarChart3, CalendarDays, CircleUserRound, Flame, LogOut, Settings2, Zap } from 'lucide-react'
import { deconnexionAction } from '@/app/(auth)/actions'

const NAV_ITEMS = [
  { label: 'Aujourd’hui', href: '/', icon: Zap },
  { label: 'Calendrier', href: '/calendrier', icon: CalendarDays },
  { label: 'Progression', href: '/progression', icon: BarChart3 },
  { label: 'Profil', href: '/profil', icon: CircleUserRound },
] as const

export type PageActive = (typeof NAV_ITEMS)[number]['label']

/**
 * Coquille commune (sidebar desktop + bottom-nav mobile) partagée par toutes les
 * pages authentifiées. `pageActive` détermine l'onglet en surbrillance — chaque
 * page appelante sait déjà quelle route elle est, pas besoin de usePathname côté client.
 */
export function DashboardShell({
  prenom,
  pageActive,
  streak,
  children,
}: {
  prenom: string
  pageActive: PageActive
  /** Optionnel : affiché en haut à droite si fourni (flamme de régularité, visible depuis
   * n'importe quelle page — le nom de l'utilisateur, lui, est déjà dans la sidebar et sur
   * la page Profil, pas besoin de le répéter ici). */
  streak?: number
  children: React.ReactNode
}) {
  const initiales = prenom ? prenom.slice(0, 2).toUpperCase() : '—'

  return (
    <main className="momentum-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <aside className="sidebar">
        <div className="brand-mark"><span>M</span></div>
        <div className="brand-copy"><strong>momentum</strong><small>ton rythme. ta progression.</small></div>
        <nav className="side-nav" aria-label="Navigation principale">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
            <Link key={label} href={href} className={`nav-item ${pageActive === label ? 'selected' : ''}`}>
              <Icon size={18} strokeWidth={1.8} /><span>{label}</span>{pageActive === label && <i />}
            </Link>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="mini-avatar">{initiales}</div>
          <div><strong>{prenom || 'Toi'}</strong></div>
          <Link href="/profil" className="icon-button" aria-label="Paramètres"><Settings2 size={17} /></Link>
          <form action={deconnexionAction}>
            <button className="icon-button" aria-label="Se déconnecter" title="Se déconnecter">
              <LogOut size={17} />
            </button>
          </form>
        </div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div className="mobile-brand"><div className="brand-mark"><span>M</span></div><strong>momentum</strong></div>
          <div />
          <div className="top-actions">
            {!!streak && (
              <div className="streak-pill compact" title="Jours consécutifs d'activité">
                <Flame size={15} fill="currentColor" />
                <div><strong>{streak}</strong><span>jour{streak > 1 ? 's' : ''}</span></div>
              </div>
            )}
          </div>
        </header>

        {children}
      </section>

      <div className="bottom-nav">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
          <Link key={label} href={href} className={pageActive === label ? 'active' : ''}>
            <Icon size={19} /><span>{label}</span>
          </Link>
        ))}
      </div>
    </main>
  )
}
