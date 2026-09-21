import type { Metadata } from 'next'
import Link from 'next/link'
import { PageLegale, Valeur } from '@/components/legal/page-legale'
import { identiteEditeur } from '@/lib/legal'

export const metadata: Metadata = { title: 'Politique de confidentialité — Momentum' }

export default function ConfidentialitePage() {
  const editeur = identiteEditeur()

  return (
    <PageLegale titre="Politique de confidentialité">
      <p>
        Momentum est un outil de suivi sportif personnel. Cette page explique quelles données sont enregistrées quand tu
        l’utilises, pourquoi, où elles sont stockées et comment garder la main dessus.
      </p>

      <h2>1. Qui est responsable de tes données ?</h2>
      <p>
        <Valeur>{editeur.nom}</Valeur>, éditeur de Momentum. Pour toute question ou pour exercer tes droits :{' '}
        <Valeur>{editeur.email}</Valeur>.
      </p>

      <h2>2. Les données que Momentum enregistre</h2>
      <table className="legal-table">
        <thead>
          <tr><th>Catégorie</th><th>Détail</th></tr>
        </thead>
        <tbody>
          <tr><td>Compte</td><td>Prénom, adresse e-mail, mot de passe (jamais en clair : seule une empreinte est conservée), date d’acceptation de cette politique.</td></tr>
          <tr><td>Profil</td><td>Taille, poids de départ, date de naissance (facultative), objectifs, mensurations de départ (facultatives).</td></tr>
          <tr><td>Activité</td><td>Séances de musculation (exercices, séries, répétitions, charges), séances de cardio, mesures corporelles (poids, masse grasse, tours), suivi quotidien (pas, sommeil, protéines, hydratation, énergie), jours de repos, objectifs et badges débloqués.</td></tr>
          <tr><td>Sécurité</td><td>Compteurs de tentatives de connexion, d’inscription et de réinitialisation, associés à ton adresse IP ou à ton e-mail, pour bloquer les abus.</td></tr>
        </tbody>
      </table>
      <p>
        Le poids, les mensurations et l’activité sportive sont des <strong>données de santé</strong> au sens du RGPD.
        Momentum ne les utilise que pour t’afficher ton propre suivi : aucune publicité, aucune revente, aucun profilage.
      </p>

      <h2>3. Pourquoi et sur quelle base légale</h2>
      <ul>
        <li><strong>Faire fonctionner ton compte et ton suivi</strong> (compte, profil, activité) : exécution du service que tu demandes.</li>
        <li><strong>Tes données de santé</strong> : ton consentement explicite, donné en cochant la case à l’inscription. Tu peux le retirer à tout moment en supprimant ton compte.</li>
        <li><strong>Protéger le service contre les abus</strong> (limitation des tentatives) : intérêt légitime.</li>
        <li><strong>Envoyer les e-mails utiles</strong> (réinitialisation du mot de passe, confirmation de ton adresse) : exécution du service. Aucun e-mail promotionnel n’est envoyé.</li>
      </ul>

      <h2>4. Qui a accès à tes données</h2>
      <p>Personne d’autre que toi et l’éditeur. Pour fonctionner, Momentum s’appuie sur des prestataires techniques :</p>
      <ul>
        <li><strong>Vercel Inc.</strong> (États-Unis) : hébergement du site et mesure d’audience anonyme, sans cookie.</li>
        <li><strong>Neon</strong> : base de données, hébergée à Francfort (Allemagne, Union européenne).</li>
        <li><strong>Google (Gmail)</strong> (États-Unis) : acheminement des e-mails envoyés par l’application.</li>
      </ul>
      <p>
        Certains de ces prestataires sont situés hors de l’Union européenne : les transferts reposent sur les garanties
        prévues par le RGPD (clauses contractuelles types ou cadre de protection des données UE–États-Unis).
      </p>

      <h2>5. Combien de temps</h2>
      <ul>
        <li>Tes données de compte, de profil et d’activité : jusqu’à la suppression de ton compte.</li>
        <li>Liens de réinitialisation et de confirmation : 1 heure pour le premier, 24 heures pour le second, puis inutilisables.</li>
        <li>Compteurs de sécurité : environ une journée, puis supprimés lors d’un nettoyage périodique.</li>
        <li>Après suppression du compte, l’hébergeur de la base peut conserver un historique technique de restauration de courte durée.</li>
      </ul>

      <h2>6. Tes droits</h2>
      <ul>
        <li><strong>Accès et portabilité</strong> : dans <Link href="/profil">Profil</Link>, « Exporter mes données » télécharge tout ce qui te concerne au format JSON.</li>
        <li><strong>Rectification</strong> : dans <Link href="/profil/modifier">Profil → Modifier mon profil</Link>.</li>
        <li><strong>Effacement</strong> : dans Profil, « Supprimer mon compte » efface immédiatement et définitivement ton compte et toutes tes données.</li>
        <li><strong>Opposition, limitation, retrait du consentement</strong> : écris à <Valeur>{editeur.email}</Valeur>.</li>
        <li><strong>Réclamation</strong> : tu peux saisir la CNIL (<a href="https://www.cnil.fr" target="_blank" rel="noreferrer">cnil.fr</a>) si tu estimes que tes droits ne sont pas respectés.</li>
      </ul>

      <h2>7. Cookies</h2>
      <p>
        Momentum n’utilise qu’un cookie de session, nécessaire pour te garder connecté. Il n’y a ni cookie publicitaire, ni
        traceur, ni outil de suivi tiers : aucun bandeau de consentement n’est donc nécessaire.
      </p>

      <h2>8. Sécurité</h2>
      <p>
        La connexion est chiffrée (HTTPS), les mots de passe sont conservés sous forme d’empreinte, les liens de
        réinitialisation ne sont jamais stockés en clair, et les tentatives répétées sont bloquées.
      </p>

      <h2>9. Modifications</h2>
      <p>
        Si cette politique change de façon importante, la date de mise à jour ci-dessus est modifiée. Voir aussi les{' '}
        <Link href="/mentions-legales">mentions légales</Link>.
      </p>
    </PageLegale>
  )
}
