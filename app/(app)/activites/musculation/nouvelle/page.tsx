import { ActiviteShell } from '@/components/dashboard/activite-shell'
import { NouvelleSeanceForm } from './nouvelle-seance-form'
import { formatDateParam } from '@/lib/dates'

export default async function NouvelleMusculationPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const { date } = await searchParams
  const dateValue = date ?? formatDateParam(new Date())

  return (
    <ActiviteShell date={dateValue} titre="Musculation" sousTitre="Choisis le type de séance — tu ajouteras les exercices juste après.">
      <NouvelleSeanceForm date={dateValue} />
    </ActiviteShell>
  )
}
