/**
 * URL publique du site, sans slash final (sert aux liens envoyés par e-mail).
 * NEXTAUTH_URL si définie ; sinon l'URL de production fournie automatiquement par Vercel,
 * ce qui évite d'avoir à la deviner avant le premier déploiement ; sinon localhost.
 */
export function urlPublique(env: Record<string, string | undefined> = process.env): string {
  const url =
    env.NEXTAUTH_URL ||
    (env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000')
  return url.replace(/\/+$/, '')
}
