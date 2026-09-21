import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { verifierBaseCoherente } from './garde-base'

// Prisma 7 exige un "driver adapter" explicite — plus de lecture automatique
// de DATABASE_URL depuis le schéma. On garde une instance unique en dev pour
// éviter d'épuiser le pool de connexions à chaque hot-reload de Next.js.

// Refuse de démarrer si cet environnement (test, local, production) est branché sur la mauvaise base.
verifierBaseCoherente()

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
