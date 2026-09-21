import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'

export type LimiteConfig = {
  /** Nombre maximum de tentatives autorisées dans la fenêtre. */
  max: number
  /** Durée de la fenêtre, en secondes. */
  fenetreSecondes: number
}

export type ResultatLimite = { autorise: true } | { autorise: false; reessayerDansSecondes: number }

/**
 * Compte une tentative pour `cle` et dit si la limite est dépassée.
 * L'incrément est un seul INSERT ... ON CONFLICT, donc atomique même si plusieurs
 * requêtes arrivent en parallèle sur des instances serverless différentes.
 */
export async function consommerTentative(cle: string, { max, fenetreSecondes }: LimiteConfig): Promise<ResultatLimite> {
  const lignes = await prisma.$queryRaw<{ count: number; secondesRestantes: number }[]>`
    INSERT INTO rate_limits ("key", "count", "windowStart")
    VALUES (${cle}, 1, now())
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN rate_limits."windowStart" < now() - make_interval(secs => ${fenetreSecondes}) THEN 1
        ELSE rate_limits."count" + 1
      END,
      "windowStart" = CASE
        WHEN rate_limits."windowStart" < now() - make_interval(secs => ${fenetreSecondes}) THEN now()
        ELSE rate_limits."windowStart"
      END
    RETURNING
      "count",
      ceil(extract(epoch FROM (rate_limits."windowStart" + make_interval(secs => ${fenetreSecondes}) - now())))::int AS "secondesRestantes"
  `
  const { count, secondesRestantes } = lignes[0]

  // Ménage occasionnel des compteurs périmés, pour que la table ne grossisse pas indéfiniment.
  if (Math.random() < 0.01) {
    void prisma.$executeRaw`DELETE FROM rate_limits WHERE "windowStart" < now() - interval '1 day'`.catch(() => {})
  }

  if (count > max) return { autorise: false, reessayerDansSecondes: Math.max(1, secondesRestantes) }
  return { autorise: true }
}

/** Adresse IP du client. Derrière Vercel, `x-forwarded-for` est posé par la plateforme. */
export async function ipClient(): Promise<string> {
  const h = await headers()
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'inconnue'
}

/** Applique plusieurs limites (ex. par IP et par e-mail) ; la plus contraignante l'emporte. */
export async function verifierLimites(limites: [cle: string, config: LimiteConfig][]): Promise<ResultatLimite> {
  let pire: ResultatLimite = { autorise: true }
  for (const [cle, config] of limites) {
    const resultat = await consommerTentative(cle, config)
    if (!resultat.autorise && (pire.autorise || resultat.reessayerDansSecondes > pire.reessayerDansSecondes)) {
      pire = resultat
    }
  }
  return pire
}

export function messageAttente(secondes: number): string {
  const minutes = Math.ceil(secondes / 60)
  return `Trop de tentatives. Réessaie dans ${minutes} minute${minutes > 1 ? 's' : ''}.`
}
