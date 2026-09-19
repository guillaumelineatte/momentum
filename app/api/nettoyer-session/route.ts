import { signOut } from '@/auth'

// Un Server Component ne peut pas modifier les cookies pendant son rendu — seul un
// Route Handler ou une Server Action le peut. Cette route sert donc à invalider
// proprement une session dont l'utilisateur n'existe plus en base (ex. après un
// reset de la base de données) : sans elle, l'utilisateur reste coincé dans une
// boucle (session valide mais compte introuvable -> redirection -> toujours "connecté").
export async function GET() {
  await signOut({ redirectTo: '/connexion' })
}
