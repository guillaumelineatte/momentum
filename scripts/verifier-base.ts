// Lancé avant le build Vercel (script "vercel-build") : bloque le déploiement, avant toute migration,
// si la base configurée ne correspond pas à l'environnement (voir lib/garde-base.ts).
import { verifierBaseCoherente } from '../lib/garde-base'

try {
  verifierBaseCoherente()
  console.log(`Base cohérente avec l'environnement (${process.env.VERCEL_ENV ?? 'local'}).`)
} catch (erreur) {
  console.error((erreur as Error).message)
  process.exit(1)
}
