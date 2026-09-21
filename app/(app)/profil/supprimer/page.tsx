import Link from 'next/link'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getStreak } from '@/lib/data/jour'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { SupprimerForm } from './supprimer-form'

export default async function SupprimerComptePage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/connexion')

  const [profile, streak] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: session.user.id } }),
    getStreak(session.user.id),
  ])

  return (
    <DashboardShell prenom={profile?.prenom ?? ''} pageActive="Profil" streak={streak}>
      <div className="page-heading">
        <div>
          <p className="eyebrow accent">PROFIL</p>
          <h1>Supprimer mon compte</h1>
        </div>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr' }}>
        <section className="main-column" style={{ display: 'grid', gap: 14 }}>
          <article className="glass-card" style={{ borderRadius: 18, padding: 20, maxWidth: 520 }}>
            <p className="eyebrow" style={{ marginBottom: 10 }}>CE QUI SERA EFFACÉ</p>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--muted)', margin: '0 0 10px' }}>
              Ton compte et <strong>toutes</strong> tes données : profil, séances de musculation et de cardio, mesures,
              suivi quotidien, objectifs et badges. Il n’y a aucun moyen de les récupérer ensuite.
            </p>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--muted)', margin: '0 0 18px' }}>
              Tu veux d’abord en garder une copie ? <a href="/api/export" download>Exporte tes données</a> avant de continuer.
            </p>
            <SupprimerForm />
            <div className="auth-links">
              <Link href="/profil">Annuler et revenir au profil</Link>
            </div>
          </article>
        </section>
      </div>
    </DashboardShell>
  )
}
