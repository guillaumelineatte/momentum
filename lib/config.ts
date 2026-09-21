/**
 * La confirmation de l'adresse e-mail est exigée avant la première connexion. Désactivable par
 * REQUIRE_EMAIL_VERIFICATION=false (développement local sans e-mail configuré) ; jamais en production.
 */
export function verificationEmailRequise(env: Record<string, string | undefined> = process.env): boolean {
  return env.REQUIRE_EMAIL_VERIFICATION !== 'false'
}
