import { ActiviteShell } from '@/components/dashboard/activite-shell'
import { MesuresForm } from './mesures-form'
import { formatDateParam } from '@/lib/dates'

export default async function NouvellesMesuresPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const { date } = await searchParams
  const dateValue = date ?? formatDateParam(new Date())

  return (
    <ActiviteShell date={dateValue} titre="Mesures corporelles">
      <MesuresForm date={dateValue} />
    </ActiviteShell>
  )
}
