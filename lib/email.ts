import nodemailer from 'nodemailer'
import { Resend } from 'resend'

type Email = { to: string; subject: string; text: string; html: string }
type Env = Record<string, string | undefined>

export type TransportEmail = 'smtp' | 'resend' | 'console'

/**
 * Choix du service d'envoi, par ordre de priorité :
 * - `smtp` : SMTP_HOST + SMTP_USER + SMTP_PASSWORD (ex. une boîte Gmail dédiée avec mot de passe
 *   d'application : aucun nom de domaine requis, envoie à n'importe quelle adresse) ;
 * - `resend` : RESEND_API_KEY (sans domaine vérifié, n'écrit qu'au propriétaire du compte Resend) ;
 * - `console` : développement uniquement, le message est affiché dans le terminal.
 * Un SMTP incomplet n'est pas utilisé : pas d'envoi à moitié configuré.
 */
export function choisirTransport(env: Env): TransportEmail {
  if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD) return 'smtp'
  if (env.RESEND_API_KEY) return 'resend'
  return 'console'
}

/**
 * Expéditeur : EMAIL_FROM s'il est défini, sinon l'adresse du compte SMTP (obligatoire chez Gmail)
 * ou celle de test de Resend. Une adresse de test `@resend.dev` est ignorée en SMTP : elle n'a aucun
 * lien avec la boîte qui envoie et ferait classer les messages en spam.
 */
export function expediteur(env: Env, transport: TransportEmail): string {
  const configure = env.EMAIL_FROM
  const adresseDeTestResend = !!configure && /@resend\.dev>?\s*$/i.test(configure)
  if (configure && !(transport === 'smtp' && adresseDeTestResend)) return configure
  return transport === 'smtp' ? `Momentum <${env.SMTP_USER}>` : 'Momentum <onboarding@resend.dev>'
}

async function envoyerParSmtp(env: Env, from: string, mail: Email): Promise<void> {
  // `|| 465` et non `?? 465` : une variable présente mais vide (Number('') vaut 0) doit aussi retomber sur 465.
  const port = Number(env.SMTP_PORT) || 465
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  })
  await transporter.sendMail({ from, to: mail.to, subject: mail.subject, text: mail.text, html: mail.html })
}

async function envoyerParResend(env: Env, from: string, mail: Email): Promise<void> {
  // Client créé à l'envoi et non à l'import : une RESEND_API_KEY absente ne doit pas faire planter
  // tout le bundle de Server Actions qui importe ce fichier (connexion et inscription comprises).
  const { error } = await new Resend(env.RESEND_API_KEY).emails.send({
    from,
    to: mail.to,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
  })
  // Le SDK Resend ne lève pas d'exception sur une erreur API : sans ce test, un échec passerait inaperçu.
  if (error) throw new Error(`Échec de l'envoi de l'e-mail (Resend) : ${error.message}`)
}

/**
 * Envoie un e-mail. Sans aucun service configuré : affichage dans le terminal en développement ;
 * en production on refuse d'envoyer, pour qu'un lien de réinitialisation ne finisse jamais dans les journaux.
 */
export async function envoyerEmail(mail: Email): Promise<void> {
  const env = process.env
  const transport = choisirTransport(env)

  if (transport === 'console') {
    if (env.NODE_ENV === 'production') {
      throw new Error("Aucun service d'e-mail configuré (SMTP_HOST, SMTP_USER, SMTP_PASSWORD ou RESEND_API_KEY).")
    }
    console.log(`\n[e-mail de développement] à ${mail.to} — ${mail.subject}\n${mail.text}\n`)
    return
  }

  const from = expediteur(env, transport)
  if (transport === 'smtp') await envoyerParSmtp(env, from, mail)
  else await envoyerParResend(env, from, mail)
}

const echapperHtml = (texte: string) =>
  texte.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] ?? c)

type Gabarit = { sujet: string; titre: string; intro: string; bouton: string; lien: string; pied: string }

/** Même mise en page (texte + HTML) pour tous les e-mails de l'application. */
function composer(destinataire: string, g: Gabarit): Email {
  const lien = echapperHtml(g.lien)
  return {
    to: destinataire,
    subject: g.sujet,
    text: [g.intro, '', g.lien, '', g.pied].join('\n'),
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #be123c;">${echapperHtml(g.titre)}</h2>
        <p>${echapperHtml(g.intro)}</p>
        <p>
          <a href="${lien}" style="display: inline-block; padding: 12px 20px; background: #e11d48; color: white; border-radius: 8px; text-decoration: none; font-weight: 600;">
            ${echapperHtml(g.bouton)}
          </a>
        </p>
        <p style="color: #666; font-size: 13px;">Si le bouton ne fonctionne pas, copie ce lien : ${lien}</p>
        <p style="color: #666; font-size: 13px;">${echapperHtml(g.pied)}</p>
      </div>
    `,
  }
}

export async function envoyerEmailReinitialisation(destinataire: string, lienReinitialisation: string) {
  await envoyerEmail(
    composer(destinataire, {
      sujet: 'Réinitialise ton mot de passe Momentum',
      titre: 'Réinitialisation de mot de passe',
      intro: 'Tu as demandé à réinitialiser ton mot de passe Momentum. Ce lien est valable 1 heure :',
      bouton: 'Choisir un nouveau mot de passe',
      lien: lienReinitialisation,
      pied: "Si tu n'es pas à l'origine de cette demande, ignore simplement cet e-mail.",
    }),
  )
}

export async function envoyerEmailVerification(destinataire: string, lienVerification: string) {
  await envoyerEmail(
    composer(destinataire, {
      sujet: 'Confirme ton adresse e-mail Momentum',
      titre: 'Bienvenue sur Momentum',
      intro: 'Confirme ton adresse e-mail pour activer ton compte. Ce lien est valable 24 heures :',
      bouton: 'Confirmer mon adresse',
      lien: lienVerification,
      pied: "Si tu n'as pas créé de compte Momentum, ignore simplement cet e-mail.",
    }),
  )
}
