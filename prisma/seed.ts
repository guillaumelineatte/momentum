import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

// Bibliothèque d'exercices globaux (~60), classés par groupe musculaire.
// userId reste undefined -> exercice global, visible par tous les utilisateurs.
const exercises: { nom: string; groupeMusculaire: string }[] = [
  // Pectoraux
  { nom: 'Développé couché barre', groupeMusculaire: 'PECTORAUX' },
  { nom: 'Développé couché haltères', groupeMusculaire: 'PECTORAUX' },
  { nom: 'Développé incliné haltères', groupeMusculaire: 'PECTORAUX' },
  { nom: 'Développé décliné barre', groupeMusculaire: 'PECTORAUX' },
  { nom: 'Écarté couché haltères', groupeMusculaire: 'PECTORAUX' },
  { nom: 'Pompes', groupeMusculaire: 'PECTORAUX' },
  { nom: 'Dips pectoraux', groupeMusculaire: 'PECTORAUX' },

  // Dos
  { nom: 'Tractions', groupeMusculaire: 'DOS' },
  { nom: 'Rowing barre', groupeMusculaire: 'DOS' },
  { nom: 'Rowing haltère', groupeMusculaire: 'DOS' },
  { nom: 'Tirage vertical poulie', groupeMusculaire: 'DOS' },
  { nom: 'Tirage horizontal poulie', groupeMusculaire: 'DOS' },
  { nom: 'Soulevé de terre', groupeMusculaire: 'DOS' },
  { nom: 'Rowing T-bar', groupeMusculaire: 'DOS' },

  // Épaules
  { nom: 'Développé militaire barre', groupeMusculaire: 'EPAULES' },
  { nom: 'Développé militaire haltères', groupeMusculaire: 'EPAULES' },
  { nom: 'Élévations latérales', groupeMusculaire: 'EPAULES' },
  { nom: 'Élévations frontales', groupeMusculaire: 'EPAULES' },
  { nom: 'Oiseau (élévations arrière)', groupeMusculaire: 'EPAULES' },
  { nom: 'Développé Arnold', groupeMusculaire: 'EPAULES' },

  // Biceps
  { nom: 'Curl barre', groupeMusculaire: 'BICEPS' },
  { nom: 'Curl haltères', groupeMusculaire: 'BICEPS' },
  { nom: 'Curl marteau', groupeMusculaire: 'BICEPS' },
  { nom: 'Curl pupitre', groupeMusculaire: 'BICEPS' },
  { nom: 'Curl concentré', groupeMusculaire: 'BICEPS' },

  // Triceps
  { nom: 'Extension triceps poulie haute', groupeMusculaire: 'TRICEPS' },
  { nom: 'Dips triceps', groupeMusculaire: 'TRICEPS' },
  { nom: 'Barre au front', groupeMusculaire: 'TRICEPS' },
  { nom: 'Extension nuque haltère', groupeMusculaire: 'TRICEPS' },
  { nom: 'Kickback triceps', groupeMusculaire: 'TRICEPS' },

  // Avant-bras
  { nom: 'Curl poignet', groupeMusculaire: 'AVANT_BRAS' },
  { nom: 'Extension poignet', groupeMusculaire: 'AVANT_BRAS' },
  { nom: 'Farmer walk', groupeMusculaire: 'AVANT_BRAS' },

  // Quadriceps
  { nom: 'Squat barre', groupeMusculaire: 'QUADRICEPS' },
  { nom: 'Presse à cuisses', groupeMusculaire: 'QUADRICEPS' },
  { nom: 'Fentes haltères', groupeMusculaire: 'QUADRICEPS' },
  { nom: 'Leg extension', groupeMusculaire: 'QUADRICEPS' },
  { nom: 'Squat gobelet', groupeMusculaire: 'QUADRICEPS' },
  { nom: 'Squat bulgare', groupeMusculaire: 'QUADRICEPS' },

  // Ischios
  { nom: 'Soulevé de terre roumain', groupeMusculaire: 'ISCHIOS' },
  { nom: 'Leg curl', groupeMusculaire: 'ISCHIOS' },
  { nom: 'Good morning', groupeMusculaire: 'ISCHIOS' },
  { nom: 'Soulevé de terre jambes tendues', groupeMusculaire: 'ISCHIOS' },

  // Fessiers
  { nom: 'Hip thrust', groupeMusculaire: 'FESSIERS' },
  { nom: 'Squat sumo', groupeMusculaire: 'FESSIERS' },
  { nom: 'Extension de hanche poulie', groupeMusculaire: 'FESSIERS' },
  { nom: 'Fentes marchées', groupeMusculaire: 'FESSIERS' },

  // Mollets
  { nom: 'Mollets debout', groupeMusculaire: 'MOLLETS' },
  { nom: 'Mollets assis', groupeMusculaire: 'MOLLETS' },
  { nom: 'Mollets à la presse', groupeMusculaire: 'MOLLETS' },

  // Abdominaux
  { nom: 'Crunch', groupeMusculaire: 'ABDOMINAUX' },
  { nom: 'Gainage planche', groupeMusculaire: 'ABDOMINAUX' },
  { nom: 'Relevé de jambes', groupeMusculaire: 'ABDOMINAUX' },
  { nom: 'Russian twist', groupeMusculaire: 'ABDOMINAUX' },
  { nom: 'Ab wheel', groupeMusculaire: 'ABDOMINAUX' },
  { nom: 'Crunch poulie haute', groupeMusculaire: 'ABDOMINAUX' },

  // Lombaires
  { nom: 'Hyperextension lombaire', groupeMusculaire: 'LOMBAIRES' },
  { nom: 'Superman', groupeMusculaire: 'LOMBAIRES' },

  // Cardio (utilisable aussi en muscu pour du circuit training)
  { nom: 'Course à pied (tapis)', groupeMusculaire: 'CARDIO' },
  { nom: 'Vélo elliptique', groupeMusculaire: 'CARDIO' },
  { nom: 'Rameur', groupeMusculaire: 'CARDIO' },

  // Full body
  { nom: 'Burpees', groupeMusculaire: 'FULL_BODY' },
  { nom: 'Clean and press', groupeMusculaire: 'FULL_BODY' },
  { nom: 'Kettlebell swing', groupeMusculaire: 'FULL_BODY' },
]

const badges: { cle: string; nom: string; description: string; icone: string }[] = [
  { cle: 'premiere-seance', nom: 'Premier pas', description: 'Ta première séance enregistrée.', icone: 'Sparkles' },
  { cle: 'streak-7-jours', nom: '7 jours d’affilée', description: '7 jours consécutifs d’activité.', icone: 'Flame' },
  { cle: 'streak-30-jours', nom: '30 jours d’affilée', description: '30 jours consécutifs d’activité.', icone: 'Flame' },
  { cle: '100-km-cumules', nom: '100 km cumulés', description: '100 km parcourus au total en course/cardio.', icone: 'Footprints' },
  { cle: '10-records', nom: '10 records personnels', description: '10 records personnels battus.', icone: 'Trophy' },
  { cle: 'premier-objectif', nom: 'Objectif atteint', description: 'Ton premier objectif complété.', icone: 'Target' },
  { cle: '50-seances', nom: '50 séances', description: '50 séances de musculation enregistrées.', icone: 'Dumbbell' },
]

async function main() {
  console.log('Nettoyage de la bibliothèque d’exercices globaux...')
  await prisma.exercise.deleteMany({ where: { userId: null } })

  console.log(`Insertion de ${exercises.length} exercices...`)
  await prisma.exercise.createMany({
    data: exercises.map((e) => ({ nom: e.nom, groupeMusculaire: e.groupeMusculaire as never })),
  })

  console.log(`Insertion de ${badges.length} badges...`)
  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { cle: badge.cle },
      update: { nom: badge.nom, description: badge.description, icone: badge.icone },
      create: badge,
    })
  }

  console.log('Seed terminé.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
