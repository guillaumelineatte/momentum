import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { TodayDashboard, type ActiviteJour, type JourSemaine } from '@/components/dashboard/today-dashboard'
import { getJourSummary, getQuotidienVeille, getActivitesParJour, getStreak, getStatsSemaineEnCours } from '@/lib/data/jour'
import { LABELS_TYPE_SEANCE, LABELS_TYPE_CARDIO, formatDureeMin } from '@/lib/labels'
import {
  parseDateParam,
  formatDateParam,
  semaineDe,
  labelJourLong,
  labelJourCourt,
  isToday,
  isSameDay,
} from '@/lib/dates'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; ajoute?: string }>
}) {
  const session = await auth()
  const userId = session!.user!.id!

  const { date, ajoute } = await searchParams
  const dateSelectionnee = parseDateParam(date)
  const dateParam = formatDateParam(dateSelectionnee)

  const [profile, jour, veille, joursSemaine, streak] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    getJourSummary(userId, dateSelectionnee),
    getQuotidienVeille(userId, dateSelectionnee),
    Promise.resolve(semaineDe(dateSelectionnee)),
    getStreak(userId),
  ])

  const [activitesSemaine, statsSemaine] = await Promise.all([
    getActivitesParJour(userId, joursSemaine),
    getStatsSemaineEnCours(userId, joursSemaine),
  ])

  const semaine: JourSemaine[] = joursSemaine.map((jourDeLaSemaine) => {
    const cle = formatDateParam(jourDeLaSemaine)
    const aujourdhui = isToday(jourDeLaSemaine)
    const futur = jourDeLaSemaine > new Date() && !aujourdhui
    const aActivite = activitesSemaine.has(cle)

    let etat: JourSemaine['etat']
    if (aujourdhui) etat = 'aujourdhui'
    else if (futur) etat = 'futur'
    else etat = aActivite ? 'actif' : 'inactif'

    return {
      cle,
      label: labelJourCourt(jourDeLaSemaine),
      jour: jourDeLaSemaine.getDate(),
      etat,
      selectionne: isSameDay(jourDeLaSemaine, dateSelectionnee),
    }
  })

  const activites: ActiviteJour[] = [
    ...jour.seances.map((s) => ({
      id: s.id,
      type: 'muscu' as const,
      titre: s.nomPersonnalise || LABELS_TYPE_SEANCE[s.type] || 'Musculation',
      meta: s.dureeSecondes ? `Musculation · ${formatDureeMin(s.dureeSecondes)}` : 'Musculation · en cours',
      valeur: `${s.sets.length} série${s.sets.length > 1 ? 's' : ''}`,
      href: s.dureeSecondes != null ? `/activites/musculation/${s.id}/recap` : `/activites/musculation/${s.id}`,
    })),
    ...jour.cardio.map((c) => ({
      id: c.id,
      type: 'cardio' as const,
      titre: c.nomPersonnalise || LABELS_TYPE_CARDIO[c.type] || 'Cardio',
      meta: `Cardio · ${formatDureeMin(c.dureeSecondes)}`,
      valeur: c.distanceKm ? `${c.distanceKm} km` : formatDureeMin(c.dureeSecondes),
    })),
    ...jour.mesures.map((m) => ({
      id: m.id,
      type: 'mesure' as const,
      titre: 'Mesures corporelles',
      meta: 'Suivi des mensurations',
      valeur: m.poidsKg ? `${m.poidsKg} kg` : '—',
    })),
    ...(jour.quotidien
      ? [{
          id: jour.quotidien.id,
          type: 'quotidien' as const,
          titre: 'Suivi quotidien',
          meta: 'Pas, sommeil, hydratation…',
          valeur: jour.quotidien.pas ? `${jour.quotidien.pas.toLocaleString('fr-FR')} pas` : '—',
        }]
      : []),
    ...(jour.repos
      ? [{
          id: jour.repos.id,
          type: 'repos' as const,
          titre: 'Jour de repos',
          meta: 'Récupération',
          valeur: '',
        }]
      : []),
  ]

  function tendance(actuel: number | null | undefined, precedent: number | null | undefined) {
    if (actuel == null || precedent == null) return undefined
    const diff = actuel - precedent
    if (diff === 0) return undefined
    return { valeur: diff, hausse: diff > 0 }
  }

  return (
    <TodayDashboard
      prenom={profile?.prenom ?? session?.user?.name ?? ''}
      dateSelectionnee={dateParam}
      jourLabel={labelJourLong(dateSelectionnee)}
      semaine={semaine}
      streak={streak}
      activites={activites}
      metriques={{
        pas: jour.quotidien?.pas ?? undefined,
        sommeilHeures: jour.quotidien?.sommeilHeures ?? undefined,
        hydratationL: jour.quotidien?.hydratationL ?? undefined,
        energie: jour.quotidien?.energie ?? undefined,
        tendancePas: tendance(jour.quotidien?.pas, veille?.pas),
        tendanceSommeil: tendance(jour.quotidien?.sommeilHeures, veille?.sommeilHeures),
      }}
      statsSemaine={statsSemaine}
      toastAjout={ajoute === '1'}
    />
  )
}
