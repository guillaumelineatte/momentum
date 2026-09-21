/**
 * URL publique du site, sans slash final (sert aux liens envoyés par e-mail).
 * NEXTAUTH_URL si définie ; sinon, sur Vercel, l'URL du bon environnement — celle de production
 * en production, celle du déploiement en test (un lien de test ne doit jamais pointer sur la prod) ;
 * sinon localhost.
 */
export function urlPublique(env: Record<string, string | undefined> = process.env): string {
  const hoteVercel =
    env.VERCEL_ENV === 'production' ? env.VERCEL_PROJECT_PRODUCTION_URL : env.VERCEL_BRANCH_URL || env.VERCEL_URL
  const url = env.NEXTAUTH_URL || (hoteVercel ? `https://${hoteVercel}` : 'http://localhost:3000')
  return url.replace(/\/+$/, '')
}
