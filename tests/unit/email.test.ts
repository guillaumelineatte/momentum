import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// vi.mock est remonté en haut du fichier : les doublures doivent être créées avec vi.hoisted.
const { sendMail, createTransport, resendSend } = vi.hoisted(() => {
  const sendMail = vi.fn()
  return { sendMail, createTransport: vi.fn(() => ({ sendMail })), resendSend: vi.fn() }
})
vi.mock('nodemailer', () => ({ default: { createTransport } }))
vi.mock('resend', () => ({ Resend: class { emails = { send: resendSend } } }))

import { choisirTransport, envoyerEmail, expediteur } from '@/lib/email'

const mail = { to: 'alice@example.com', subject: 'Sujet', text: 'texte', html: '<p>html</p>' }
const SMTP = { SMTP_HOST: 'smtp.gmail.com', SMTP_USER: 'app@gmail.com', SMTP_PASSWORD: 'motdepasse' }

describe('choisirTransport', () => {
  it('privilégie le SMTP complet, puis Resend, sinon la console', () => {
    expect(choisirTransport({ ...SMTP, RESEND_API_KEY: 'k' })).toBe('smtp')
    expect(choisirTransport({ RESEND_API_KEY: 'k' })).toBe('resend')
    expect(choisirTransport({})).toBe('console')
  })

  it("n'utilise pas un SMTP incomplet", () => {
    expect(choisirTransport({ SMTP_HOST: 'smtp.gmail.com', SMTP_USER: 'app@gmail.com' })).toBe('console')
    expect(choisirTransport({ SMTP_HOST: 'smtp.gmail.com', SMTP_USER: 'app@gmail.com', RESEND_API_KEY: 'k' })).toBe('resend')
  })

  it('traite une variable vide comme absente', () => {
    expect(choisirTransport({ SMTP_HOST: '', SMTP_USER: '', SMTP_PASSWORD: '', RESEND_API_KEY: '' })).toBe('console')
  })
})

describe('expediteur', () => {
  it('EMAIL_FROM prime', () => {
    expect(expediteur({ EMAIL_FROM: 'Momentum <contact@momentum.fr>', SMTP_USER: 'app@gmail.com' }, 'smtp')).toBe('Momentum <contact@momentum.fr>')
  })

  it("utilise l'adresse du compte SMTP, ou celle de test de Resend", () => {
    expect(expediteur({ SMTP_USER: 'app@gmail.com' }, 'smtp')).toBe('Momentum <app@gmail.com>')
    expect(expediteur({}, 'resend')).toBe('Momentum <onboarding@resend.dev>')
  })

  it('ignore une adresse de test @resend.dev quand on envoie par SMTP', () => {
    expect(expediteur({ EMAIL_FROM: 'Momentum <onboarding@resend.dev>', SMTP_USER: 'app@gmail.com' }, 'smtp')).toBe('Momentum <app@gmail.com>')
    expect(expediteur({ EMAIL_FROM: 'Momentum <onboarding@resend.dev>' }, 'resend')).toBe('Momentum <onboarding@resend.dev>')
  })
})

describe('envoyerEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sendMail.mockResolvedValue(undefined)
    for (const cle of ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD', 'SMTP_PORT', 'RESEND_API_KEY', 'EMAIL_FROM']) vi.stubEnv(cle, '')
  })
  afterEach(() => vi.unstubAllEnvs())

  it('envoie par SMTP avec la connexion sécurisée sur le port 465', async () => {
    for (const [cle, valeur] of Object.entries(SMTP)) vi.stubEnv(cle, valeur)
    await envoyerEmail(mail)

    expect(createTransport).toHaveBeenCalledWith(expect.objectContaining({ host: 'smtp.gmail.com', port: 465, secure: true, auth: { user: 'app@gmail.com', pass: 'motdepasse' } }))
    expect(sendMail).toHaveBeenCalledWith({ from: 'Momentum <app@gmail.com>', ...mail })
  })

  it("n'active pas la connexion directement sécurisée sur le port 587", async () => {
    for (const [cle, valeur] of Object.entries(SMTP)) vi.stubEnv(cle, valeur)
    vi.stubEnv('SMTP_PORT', '587')
    await envoyerEmail(mail)
    expect(createTransport).toHaveBeenCalledWith(expect.objectContaining({ port: 587, secure: false }))
  })

  it("lève une erreur quand Resend refuse l'envoi", async () => {
    vi.stubEnv('RESEND_API_KEY', 'cle')
    resendSend.mockResolvedValue({ data: null, error: { message: 'domaine non vérifié' } })
    await expect(envoyerEmail(mail)).rejects.toThrow(/domaine non vérifié/)
  })

  it('affiche le message dans le terminal en développement', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const journal = vi.spyOn(console, 'log').mockImplementation(() => {})
    await envoyerEmail(mail)
    expect(journal).toHaveBeenCalledWith(expect.stringContaining('alice@example.com'))
    expect(sendMail).not.toHaveBeenCalled()
    journal.mockRestore()
  })

  it("refuse d'envoyer en production sans aucun service configuré", async () => {
    vi.stubEnv('NODE_ENV', 'production')
    await expect(envoyerEmail(mail)).rejects.toThrow(/Aucun service d'e-mail configuré/)
  })
})
