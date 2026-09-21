import { auth } from '@/auth'
import { exporterDonnees } from '@/lib/data/export'
import { consommerTentative } from '@/lib/rate-limit'

// Le proxy laisse passer /api : la session est donc vérifiée ici, dans le handler lui-même.
export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return Response.json({ erreur: 'Non connecté.' }, { status: 401 })

  const limite = await consommerTentative(`export:user:${userId}`, { max: 10, fenetreSecondes: 60 * 60 })
  if (!limite.autorise) {
    return Response.json({ erreur: 'Trop de demandes. Réessaie plus tard.' }, { status: 429, headers: { 'Retry-After': String(limite.reessayerDansSecondes) } })
  }

  const donnees = await exporterDonnees(userId)
  const jour = new Date().toISOString().slice(0, 10)
  return new Response(JSON.stringify(donnees, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="momentum-donnees-${jour}.json"`,
      'Cache-Control': 'no-store', // données personnelles : jamais en cache
    },
  })
}
