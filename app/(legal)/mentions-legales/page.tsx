import type { Metadata } from 'next'
import Link from 'next/link'
import { PageLegale, Valeur } from '@/components/legal/page-legale'
import { identiteEditeur } from '@/lib/legal'

export const metadata: Metadata = { title: 'Mentions légales — Momentum' }

export default function MentionsLegalesPage() {
  const editeur = identiteEditeur()

  return (
    <PageLegale titre="Mentions légales">
      <h2>Éditeur du site</h2>
      <p>
        <Valeur>{editeur.nom}</Valeur>
        {editeur.adresse && <>, <Valeur>{editeur.adresse}</Valeur></>}
        <br />
        Contact : <Valeur>{editeur.email}</Valeur>
        <br />
        Directeur de la publication : <Valeur>{editeur.nom}</Valeur>
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
