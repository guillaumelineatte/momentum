import type { NextAuthConfig } from 'next-auth'

// Config "edge-safe" : aucune dépendance Node (Prisma, bcrypt) ici, car elle
// est aussi utilisée par le middleware qui tourne en edge runtime.
// La logique d'authentification réelle (Credentials + Prisma) vit dans auth.ts.
export const authConfig = {
  pages: {
    signIn: '/connexion',
  },
  session: {
    // Obligatoire avec le Credentials provider (pas de session base de données possible).
    strategy: 'jwt',
  },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user
      const { pathname } = request.nextUrl

      const isAuthRoute =
        pathname.startsWith('/connexion') ||
        pathname.startsWith('/inscription') ||
        pathname.startsWith('/mot-de-passe-oublie') ||
        pathname.startsWith('/reinitialiser-mot-de-passe')

      // Pages légales : lisibles sans compte (obligatoire, et nécessaire avant de s'inscrire).
      if (pathname === '/confidentialite' || pathname === '/mentions-legales') return true

      if (isAuthRoute) {
        // Déjà connecté -> inutile de revoir les écrans d'auth.
        if (isLoggedIn) return Response.redirect(new URL('/', request.nextUrl))
        return true
      }

      // Toutes les autres routes de l'app exigent une session.
      return isLoggedIn
    },
    jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    session({ session, token }) {
      if (session.user) session.user.id = token.id as string
      return session
    },
  },
  providers: [], // renseigné dans auth.ts (Credentials a besoin de bcrypt + Prisma)
} satisfies NextAuthConfig
