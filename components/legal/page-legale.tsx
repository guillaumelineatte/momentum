import Link from 'next/link'
import { DATE_MISE_A_JOUR } from '@/lib/legal'

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
