import Link from 'next/link'
import { Pencil } from 'lucide-react'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getStreak } from '@/lib/data/jour'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { deconnexionAction } from '@/app/(auth)/actions'
import { OBJECTIFS } from '@/lib/validations/onboarding'
import { labelJourLongAvecAnnee } from '@/lib/dates'
import { LiensLegaux } from '@/components/legal/liens-legaux'

export default async function ProfilPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/connexion')

  const [profile, user, streak] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: session.user.id } }),
    prisma.user.findUnique({ where: { id: session.user.id } }),
    getStreak(session.user.id),
  ])

  const labelsObjectifs = new Map(OBJECTIFS.map((o) => [o.value, o.label]))

  return (
    <DashboardShell prenom={profile?.prenom ?? ''} pageActive="Profil" streak={streak}>
      <div className="page-heading">
        <div>
          <p className="eyebrow accent">PROFIL</p>
          <h1>{profile?.prenom ?? 'Ton profil'}</h1>
          <p className="subheading">{user?.email}</p>
        </div>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr' }}>
        <section className="main-column" style={{ display: 'grid', gap: 14 }}>
          <article className="glass-card" style={{ borderRadius: 18, padding: 20 }}>
            <p className="eyebrow" style={{ marginBottom: 14 }}>POINT DE DÉPART</p>
            <div className="progress-stats" style={{ border: 0, padding: 0 }}>
              <div><strong>{profile?.tailleCm ?? '—'}</strong><span>taille (cm)</span></div>
              <div><strong>{profile?.poidsDepartKg ?? '—'}</strong><span>poids (kg)</span></div>
              <div><strong>{profile ? labelJourLongAvecAnnee(profile.dateDepart) : '—'}</strong><span>depuis le</span></div>
            </div>
          </article>

          <article className="glass-card" style={{ borderRadius: 18, padding: 20 }}>
            <p className="eyebrow" style={{ marginBottom: 14 }}>OBJECTIFS</p>
            {profile?.objectifs?.length ? (
              <div className="checkbox-grid" style={{ marginBottom: 0 }}>
                {profile.objectifs.map((o) => (
                  <div className="checkbox-card" key={o} style={{ cursor: 'default' }}>{labelsObjectifs.get(o) ?? o}</div>
                ))}
              </div>
            ) : (
              <div className="empty-state">Aucun objectif renseigné.</div>
            )}
          </article>

          <Link href="/profil/modifier" className="glass-card" style={{ borderRadius: 18, padding: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="stub-icon" style={{ margin: 0 }}><Pencil size={20} /></div>
            <div style={{ flex: 1 }}>
              <strong style={{ display: 'block', fontSize: 13 }}>Modifier mon profil</strong>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>Prénom, taille, date de naissance, objectifs.</span>
            </div>
          </Link>

          <form action={deconnexionAction}>
            <button className="form-submit" type="submit">Se déconnecter</button>
          </form>

          <LiensLegaux />
        </section>
      </div>
    </DashboardShell>
  )
}
