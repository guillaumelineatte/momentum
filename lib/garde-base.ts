import { createHash } from 'node:crypto'

/**
 * Garde-fou : empêche qu'un environnement d'un type se branche sur la base de l'autre
 * (version de test ou serveur local sur la production, ou production sur la base de dev).
 *
 * La base est identifiée par l'identifiant de son endpoint Neon (ex. "ep-xxx-yyy-123abc"), lu dans
 * DATABASE_URL, et non par une étiquette à régler à la main : une mauvaise URL est donc détectée
 * même si tout le reste de la configuration est correct. Le code ne contient que des empreintes
 * SHA-256 de ces identifiants, pas les identifiants eux-mêmes.
 *
 * Une base inconnue (nouvel endpoint, autre hébergeur) passe : seules les confusions connues bloquent,
 * pour qu'un changement légitime de base ne provoque pas une panne.
 */
export const EMPREINTES_BASES = {
  production: 'c9303c1b7718525ade616bded141f0094f2ccb8aae7c0b085863061114dd6023',
  dev: '29123bcf09bd5bae3988b9f409cc49a249e9cfaa195696ef2b0d6a3282d3bae4',
} as const

export type TypeBase = 'production' | 'dev' | 'inconnue'

const sha256 = (texte: string) => createHash('sha256').update(texte).digest('hex')

/** Identifiant d'endpoint Neon : premier segment de l'hôte, sans le suffixe "-pooler". */
function identifiantEndpoint(databaseUrl: string): string | null {
  try {
    return new URL(databaseUrl).hostname.split('.')[0].replace(/-pooler$/, '')
  } catch {
    return null
  }
}

export function typeDeBase(databaseUrl: string, empreintes: Record<'production' | 'dev', string> = EMPREINTES_BASES): TypeBase {
  const endpoint = identifiantEndpoint(databaseUrl)
  if (!endpoint) return 'inconnue'
  const empreinte = sha256(endpoint)
  if (empreinte === empreintes.production) return 'production'
  if (empreinte === empreintes.dev) return 'dev'
  return 'inconnue'
}

/** Lève une erreur explicite (sans aucun secret) si l'environnement et la base ne sont pas cohérents. */
export function verifierBaseCoherente(
  env: Record<string, string | undefined> = process.env,
  empreintes: Record<'production' | 'dev', string> = EMPREINTES_BASES,
): void {
  if (!env.DATABASE_URL) return // rien à protéger (ex. build sans base)

  const base = typeDeBase(env.DATABASE_URL, empreintes)
  const environnement = env.VERCEL_ENV ?? 'local'

  if (environnement === 'production' && base === 'dev') {
    throw new Error(
      "Garde-fou : ce déploiement de PRODUCTION est branché sur la base DEV. Corrige DATABASE_URL (environnement Production) dans Vercel.",
    )
  }
  if (environnement !== 'production' && base === 'production') {
    throw new Error(
      `Garde-fou : l'environnement « ${environnement} » est branché sur la base de PRODUCTION. ` +
        'Utilise la branche Neon dev (DATABASE_URL) : une version de test ou un serveur local ne doit jamais écrire en production.',
    )
  }
}
