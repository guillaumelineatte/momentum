import type { Metadata } from 'next'
import Link from 'next/link'
import { PageLegale } from '@/components/legal/page-legale'
import { EDITEUR } from '@/lib/legal'

export const metadata: Metadata = { title: 'Mentions légales — Momentum' }

export default function MentionsLegalesPage() {
  return (
    <PageLegale titre="Mentions légales">
      <h2>Éditeur du site</h2>
      <p>
        {EDITEUR.nom}
        <br />
        Contact : <a href={`mailto:${EDITEUR.email}`}>{EDITEUR.email}</a>
        <br />
        Directeur de la publication : {EDITEUR.nom}
      </p>

      <h2>Hébergement</h2>
      <ul>
        <li><strong>Site :</strong> Vercel Inc. (États-Unis), <a href="https://vercel.com" target="_blank" rel="noreferrer">vercel.com</a>.</li>
        <li><strong>Base de données :</strong> Neon, région Francfort (Allemagne), <a href="https://neon.com" target="_blank" rel="noreferrer">neon.com</a>.</li>
      </ul>

      <h2>Données personnelles</h2>
      <p>
        Le traitement de tes données est décrit dans la <Link href="/confidentialite">politique de confidentialité</Link>.
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        Le nom, le logo et le contenu de Momentum appartiennent à leur éditeur. Les données que tu saisis restent les tiennes.
      </p>

      <h2>Avertissement</h2>
      <p>
        Momentum est un outil de suivi personnel, pas un dispositif médical. Il ne remplace pas l’avis d’un médecin ou d’un
        professionnel de santé ; consulte-en un avant de démarrer ou de modifier une pratique sportive ou un régime.
      </p>
    </PageLegale>
  )
}
