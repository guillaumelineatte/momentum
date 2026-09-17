import { ActiviteShell } from '@/components/dashboard/activite-shell'
import { CardioForm } from './cardio-form'
import { formatDateParam } from '@/lib/dates'

export default async function NouvelleCardioPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const { date } = await searchParams
  const dateValue = date ?? formatDateParam(new Date())

  return (
    <ActiviteShell date={dateValue} titre="Course à pied / cardio" sousTitre="Distance, durée, ressenti — l'allure est calculée automatiquement.">
      <CardioForm date={dateValue} />
    </ActiviteShell>
  )
}
