import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { authConfig } from './auth.config'
import { prisma } from './lib/prisma'
import { verifyPassword } from './lib/password'
import { connexionSchema } from './lib/validations/auth'
import { verificationEmailRequise } from './lib/config'
import { EmailNonVerifieError } from './lib/auth-errors'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(rawCredentials) {
        const parsed = connexionSchema.safeParse(rawCredentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data

        const user = await prisma.user.findUnique({ where: { email } })
        if (!user?.passwordHash) return null

        const passwordValide = await verifyPassword(password, user.passwordHash)
        if (!passwordValide) return null

        // Après le mot de passe seulement, pour ne rien révéler à qui ne connaît pas les identifiants.
        if (verificationEmailRequise() && !user.emailVerified) throw new EmailNonVerifieError()

        return { id: user.id, name: user.name, email: user.email }
      },
    }),
  ],
})
