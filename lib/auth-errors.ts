import { CredentialsSignin } from 'next-auth'

/**
 * Levée par `authorize` quand le mot de passe est correct mais l'adresse e-mail pas encore confirmée.
 * Levée seulement après vérification du mot de passe : elle ne révèle donc jamais qu'un compte existe
 * à quelqu'un qui ne connaît pas ses identifiants.
 */
export class EmailNonVerifieError extends CredentialsSignin {
  code = 'email_non_verifie'
}
