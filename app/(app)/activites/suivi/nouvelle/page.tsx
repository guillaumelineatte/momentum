import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { ActiviteShell } from '@/components/dashboard/activite-shell'
import { SuiviForm } from './suivi-form'
import { formatDateParam, parseDateParam, jourRange } from '@/lib/dates'
import { prisma } from '@/lib/prisma'

export default async function NouveauSuiviPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/connexion')

  const { date } = await searchParams
  const dateObj = parseDateParam(date)
  const dateValue = formatDateParam(dateObj)
  const { debut, fin } = jourRange(dateObj)

  const existant = await prisma.dailyMetric.findFirst({
    where: { userId: session.user.id, date: { gte: debut, lte: fin } },
  })

  return (
    <ActiviteShell date={dateValue} titre="Suivi quotidien" sousTitre="Ce suivi remplace celui du jour s'il existe déjà.">
      <SuiviForm
        date={dateValue}
        valeursInitiales={
          existant
            ? {
                pas: existant.pas,
                sommeilHeures: existant.sommeilHeures,
                qualiteSommeil: existant.qualiteSommeil,
                proteinesG: existant.proteinesG,
                hydratationL: existant.hydratationL,
                energie: existant.energie,
              }
            : undefined
        }
      />
    </ActiviteShell>
  )
}
