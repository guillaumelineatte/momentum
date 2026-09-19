import { Resend } from 'resend'

// Instanciation paresseuse : si le SDK Resend créait son client dès l'import
// du module (top-level), une RESEND_API_KEY manquante ferait planter TOUT le
// bundle de Server Actions qui importe ce fichier — y compris connexion/
// inscription, qui n'ont pourtant rien à voir avec l'envoi d'e-mail.
function getResendClient() {
  return new Resend(process.env.RESEND_API_KEY)
}

export async function envoyerEmailReinitialisation(destinataire: string, lienReinitialisation: string) {
  const resend = getResendClient()
  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? 'Momentum <onboarding@resend.dev>',
    to: destinataire,
    subject: 'Réinitialise ton mot de passe Momentum',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #be123c;">Réinitialisation de mot de passe</h2>
        <p>Tu as demandé à réinitialiser ton mot de passe Momentum. Ce lien est valable 1 heure :</p>
        <p>
          <a href="${lienReinitialisation}" style="display: inline-block; padding: 12px 20px; background: #e11d48; color: white; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Choisir un nouveau mot de passe
          </a>
        </p>
        <p style="color: #666; font-size: 13px;">Si tu n'es pas à l'origine de cette demande, ignore simplement cet e-mail.</p>
      </div>
    `,
  })

  // Le SDK Resend ne lève pas d'exception sur une erreur API : il faut vérifier
  // `error` explicitement, sinon un échec d'envoi passe silencieusement inaperçu.
  if (error) {
    console.error('Échec envoi e-mail Resend:', error)
    throw new Error(`Échec de l'envoi de l'e-mail : ${error.message}`)
  }

  return data
}
