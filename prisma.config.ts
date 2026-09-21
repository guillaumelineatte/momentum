import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // Pas env() : il plante si la variable est absente, or `prisma generate` (postinstall)
    // n'en a pas besoin — un déploiement Vercel sans DATABASE_URL échouerait dès l'installation.
    url: process.env.DATABASE_URL ?? '',
  },
})
