/**
 * Identité de l'éditeur des pages légales, lue dans l'environnement pour ne jamais figer
 * des informations personnelles dans le code. Une valeur absente s'affiche « [à compléter] »,
 * surlignée, afin qu'on ne publie pas le site en oubliant de la renseigner.
 */
export const A_COMPLETER = '[à compléter]'

export const DATE_MISE_A_JOUR = '21 septembre 2026'

export type IdentiteEditeur = { nom: string; email: string; adresse: string | null }

export function identiteEditeur(env: Record<string, string | undefined> = process.env): IdentiteEditeur {
  return {
    nom: env.LEGAL_EDITOR_NAME?.trim() || A_COMPLETER,
    email: env.LEGAL_CONTACT_EMAIL?.trim() || A_COMPLETER,
    // Facultative : un particulier non professionnel peut ne pas publier son adresse (LCEN, art. 6-III-2),
    // à condition de l'avoir communiquée à l'hébergeur.
    adresse: env.LEGAL_EDITOR_ADDRESS?.trim() || null,
  }
}
