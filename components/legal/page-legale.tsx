import Link from 'next/link'
import { A_COMPLETER, DATE_MISE_A_JOUR } from '@/lib/legal'

/** Affiche une valeur d'identité ; « [à compléter] » est surligné pour ne pas passer inaperçu. */
export function Valeur({ children }: { children: string }) {
  return children === A_COMPLETER ? <mark className="legal-todo">{children}</mark> : <>{children}</>
}

export function PageLegale({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <main className="legal-page">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <article className="glass-card legal-card">
        <Link href="/" className="legal-retour">← Retour à Momentum</Link>
        <h1>{titre}</h1>
        <p className="legal-maj">Dernière mise à jour : {DATE_MISE_A_JOUR}</p>
        {children}
      </article>
    </main>
  )
}
