/**
 * Identité de l'éditeur des pages légales (mentions légales et politique de confidentialité).
 *
 * - Le nom est écrit ici : ce n'est pas un secret, et il figure déjà dans l'historique du dépôt.
 * - L'adresse de contact est celle de la boîte e-mail dédiée à l'application (SMTP_USER), la même que
 *   celle qui envoie les messages : aucune variable supplémentaire à configurer. Absente (ex. en local
 *   sans SMTP), elle s'affiche « [à compléter] », surlignée, pour qu'on ne l'oublie pas.
 * - Aucune adresse postale : un particulier non professionnel peut ne pas publier son adresse
 *   (LCEN, art. 6-III-2), à condition de l'avoir communiquée à l'hébergeur.
 */
export const A_COMPLETER = '[à compléter]'

export const DATE_MISE_A_JOUR = '21 septembre 2026'

export const NOM_EDITEUR = 'Guillaume Linéatte'

export type IdentiteEditeur = { nom: string; email: string; adresse: string | null }

export function identiteEditeur(env: Record<string, string | undefined> = process.env): IdentiteEditeur {
  return {
    nom: NOM_EDITEUR,
    email: env.SMTP_USER?.trim() || A_COMPLETER,
    adresse: null,
  }
}
