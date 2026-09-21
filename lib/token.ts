import { createHash } from 'node:crypto'

/**
 * Les jetons de réinitialisation ne sont jamais stockés en clair : seule leur empreinte
 * SHA-256 va en base, donc une fuite de la table ne permet pas de réinitialiser un compte.
 * Un simple hash suffit ici (jeton aléatoire de 256 bits, pas un mot de passe choisi par un humain).
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}
