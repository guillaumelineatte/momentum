import Link from 'next/link'

export function LiensLegaux() {
  return (
    <p className="legal-links">
      <Link href="/confidentialite">Confidentialité</Link>
      <span aria-hidden="true"> · </span>
      <Link href="/mentions-legales">Mentions légales</Link>
    </p>
  )
}
