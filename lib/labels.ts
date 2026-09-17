export const LABELS_TYPE_SEANCE: Record<string, string> = {
  PUSH: 'Push',
  PULL: 'Pull',
  LEGS: 'Legs',
  UPPER: 'Upper',
  LOWER: 'Lower',
  FULL_BODY: 'Full body',
  PERSONNALISE: 'Personnalisé',
}

export const LABELS_TYPE_CARDIO: Record<string, string> = {
  FOOTING: 'Footing',
  FRACTIONNE: 'Fractionné',
  SORTIE_LONGUE: 'Sortie longue',
  TEMPO: 'Tempo',
  VELO: 'Vélo',
  NATATION: 'Natation',
  MARCHE: 'Marche',
  RAMEUR: 'Rameur',
  AUTRE: 'Cardio',
}

export function formatDureeMin(secondes: number): string {
  const minutes = Math.round(secondes / 60)
  return `${minutes} min`
}
