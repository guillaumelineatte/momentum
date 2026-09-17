import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { TodayDashboard } from '@/components/dashboard/today-dashboard'

export default async function Page() {
  const session = await auth()
  const profile = await prisma.profile.findUnique({ where: { userId: session!.user!.id! } })

  return <TodayDashboard prenom={profile?.prenom ?? session?.user?.name ?? ''} />
}
