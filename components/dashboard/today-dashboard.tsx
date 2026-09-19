'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowDownRight,
  ArrowUpRight,
  BedDouble,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Flame,
  Footprints,
  Gauge,
  HeartPulse,
  MoreHorizontal,
  Plus,
  Scale,
  Sparkles,
  Target,
  Timer,
  Trash2,
  Waves,
  X,
} from 'lucide-react'
import { DashboardShell } from './dashboard-shell'
import { Portal } from '@/components/portal'
import { CompteurAnime } from '@/components/compteur-anime'
import {
  supprimerSeanceAction,
  supprimerCardioAction,
  supprimerMesureAction,
  supprimerQuotidienAction,
  supprimerReposAction,
  marquerJourReposAction,
} from '@/app/(app)/activites/actions'

export type JourSemaine = {
  cle: string
  label: string
  jour: number
  etat: 'aujourdhui' | 'actif' | 'inactif' | 'futur'
  selectionne: boolean
}

export type ActiviteJour = {
  id: string
  type: 'muscu' | 'cardio' | 'mesure' | 'quotidien' | 'repos'
  titre: string
  meta: string
  valeur: string
  href?: string
}

type Tendance = { valeur: number; hausse: boolean }

const ICONES: Record<ActiviteJour['type'], typeof Dumbbell> = {
  muscu: Dumbbell,
  cardio: Footprints,
  mesure: Scale,
  quotidien: HeartPulse,
  repos: BedDouble,
}
const COULEURS: Record<ActiviteJour['type'], string> = {
  muscu: 'coral',
  cardio: 'blue',
  mesure: 'gold',
  quotidien: 'violet',
  repos: 'green',
}
const SUPPRESSIONS: Record<ActiviteJour['type'], (id: string) => Promise<void>> = {
  muscu: supprimerSeanceAction,
  cardio: supprimerCardioAction,
  mesure: supprimerMesureAction,
  quotidien: supprimerQuotidienAction,
  repos: supprimerReposAction,
}

export function TodayDashboard({
  prenom,
  dateSelectionnee,
  jourLabel,
  semaine,
  streak,
  activites,
  metriques,
  statsSemaine,
  toastAjout,
}: {
  prenom: string
  dateSelectionnee: string
  jourLabel: string
  semaine: JourSemaine[]
  streak: number
  activites: ActiviteJour[]
  metriques: {
    pas?: number
    sommeilHeures?: number
    hydratationL?: number
    energie?: number
    tendancePas?: Tendance
    tendanceSommeil?: Tendance
  }
  statsSemaine: { pourcentageSemaine: number; seances: number; kmParcourus: number; joursActifs: number }
  toastAjout: boolean
}) {
  const [showAdd, setShowAdd] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [aSupprimer, setASupprimer] = useState<ActiviteJour | null>(null)
  const [suppressionEnCours, setSuppressionEnCours] = useState(false)
  const [reposEnCours, setReposEnCours] = useState(false)

  useEffect(() => {
    if (!toastAjout) return
    setToast('Activité ajoutée à ta journée')
    try { navigator.vibrate?.(30) } catch {}
    const url = new URL(window.location.href)
    url.searchParams.delete('ajoute')
    window.history.replaceState({}, '', url)
  }, [toastAjout])

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(null), 2800)
    return () => window.clearTimeout(timeout)
  }, [toast])

  async function confirmerSuppression() {
    if (!aSupprimer) return
    setSuppressionEnCours(true)
    try {
      await SUPPRESSIONS[aSupprimer.type](aSupprimer.id)
      setToast('Activité supprimée')
      setASupprimer(null)
    } catch {
      setToast('Impossible de supprimer cette activité, réessaie.')
    } finally {
      setSuppressionEnCours(false)
    }
  }

  const semaineIndexActuel = semaine.findIndex((j) => j.selectionne)
  const jourPrecedent = semaine[0]?.cle
  const jourSuivant = semaine[semaine.length - 1]?.cle

  async function marquerRepos() {
    setReposEnCours(true)
    try {
      await marquerJourReposAction(dateSelectionnee)
      setShowAdd(false)
      setToast('Jour de repos enregistré')
    } catch {
      setToast("Impossible d'enregistrer ce jour de repos, réessaie.")
    } finally {
      setReposEnCours(false)
    }
  }

  return (
    // Pas de `streak` ici : la page Aujourd'hui a déjà son propre streak-pill bien visible
    // dans le page-heading juste en dessous, pas besoin de le dupliquer dans la topbar.
    <DashboardShell prenom={prenom} pageActive="Aujourd’hui">
      <div className="page-heading">
        <div>
          <p className="eyebrow accent">{jourLabel.toUpperCase()}</p>
          <h1>On garde le <em>momentum.</em></h1>
          <p className="subheading">Chaque séance compte. Même les petites.</p>
        </div>
        {streak > 0 && (
          <div className="streak-pill">
            <Flame size={24} fill="currentColor" />
            <div><strong><CompteurAnime valeur={streak} /> jour{streak > 1 ? 's' : ''}</strong><span>de régularité</span></div>
          </div>
        )}
      </div>

      <div className="week-strip glass-card">
        <Link href={`/?date=${jourPrecedent}`} className="circle-arrow" aria-label="Semaine précédente" scroll={false}><ChevronLeft size={18} /></Link>
        <div className="week-days">
          {semaine.map((j) => (
            <Link key={j.cle} href={`/?date=${j.cle}`} className={`day-cell ${j.selectionne ? 'current' : ''}`} scroll={false}>
              <span>{j.label}</span>
              <strong>{j.jour}</strong>
              <i className={j.etat === 'actif' ? 'done' : j.etat === 'aujourdhui' ? 'active' : j.etat === 'futur' ? 'planned' : 'rest'} />
            </Link>
          ))}
        </div>
        <Link href={`/?date=${jourSuivant}`} className="circle-arrow" aria-label="Semaine suivante" scroll={false}><ChevronRight size={18} /></Link>
        <Link href={`/calendrier?date=${dateSelectionnee}`} className="calendar-button"><CalendarDays size={16} /> <span>Calendrier</span></Link>
      </div>

      <div className="dashboard-grid">
        <section className="main-column">
          <div className="section-title">
            <div><p className="eyebrow">JOUR SÉLECTIONNÉ</p><h2>{jourLabel}</h2></div>
            <Link href={`/comparer?date=${dateSelectionnee}`} className="compare-button"><ArrowUpRight size={15} /> Comparer</Link>
          </div>

          <div className="activity-list">
            {activites.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon"><Sparkles size={17} /></div>
                Rien d’enregistré ce jour-là pour l’instant.
              </div>
            )}
            {activites.map((activite) => {
              const Icon = ICONES[activite.type]
              const contenu = (
                <>
                  <div className={`activity-icon ${COULEURS[activite.type]}`}><Icon size={20} /></div>
                  <div className="activity-info"><strong>{activite.titre}</strong><span>{activite.meta}</span></div>
                  {activite.valeur && <b>{activite.valeur}</b>}
                </>
              )
              return (
                <article className="activity-card glass-card" key={`${activite.type}-${activite.id}`}>
                  {activite.href ? (
                    <Link href={activite.href} style={{ display: 'contents' }}>{contenu}</Link>
                  ) : contenu}
                  <button className="more-button" aria-label={`Supprimer ${activite.titre}`} onClick={() => setASupprimer(activite)}>
                    <MoreHorizontal size={17} />
                  </button>
                </article>
              )
            })}
            <button className="add-activity glass-card" onClick={() => setShowAdd(true)}>
              <span className="plus-icon"><Plus size={21} /></span>
              <span><strong>Ajouter une activité</strong><small>Enregistre ta séance ou ton suivi du jour</small></span>
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="section-title metrics-title">
            <div><p className="eyebrow">VUE D’ENSEMBLE</p><h2>Les chiffres du jour</h2></div>
          </div>
          <div className="metric-grid">
            <MetricCard icon={Footprints} label="Pas" value={metriques.pas?.toLocaleString('fr-FR') ?? '—'} unit="pas" tendance={metriques.tendancePas} color="blue" />
            <MetricCard icon={Timer} label="Sommeil" value={metriques.sommeilHeures != null ? `${metriques.sommeilHeures}h` : '—'} unit="" tendance={metriques.tendanceSommeil} color="violet" />
            <MetricCard icon={HeartPulse} label="Hydratation" value={metriques.hydratationL != null ? `${metriques.hydratationL}` : '—'} unit="/ jour (L)" color="cyan" />
            <MetricCard icon={Gauge} label="Énergie" value={metriques.energie != null ? `${metriques.energie}` : '—'} unit="/ 5" color="gold" />
          </div>
        </section>

        <aside className="right-column">
          <section className="progress-card glass-card">
            <div className="card-heading"><div><p className="eyebrow">PROGRESSION HEBDO</p><h3>{statsSemaine.joursActifs > 0 ? 'Tu es sur la bonne voie' : 'Ta semaine démarre ici'}</h3></div><span className="sparkle"><Sparkles size={16} /></span></div>
            <div className="progress-ring" style={{ background: `conic-gradient(var(--coral) 0 ${statsSemaine.pourcentageSemaine}%, rgba(255,255,255,.1) ${statsSemaine.pourcentageSemaine}% 100%)` }}>
              <div className="ring-inner"><strong><CompteurAnime valeur={statsSemaine.pourcentageSemaine} suffixe="%" /></strong><span>jours actifs</span></div>
            </div>
            <div className="progress-stats">
              <div><strong><CompteurAnime valeur={statsSemaine.seances} /></strong><span>séances</span></div>
              <div><strong><CompteurAnime valeur={statsSemaine.kmParcourus} decimales={1} /></strong><span>km parcourus</span></div>
              <div><strong><CompteurAnime valeur={statsSemaine.joursActifs} /></strong><span>jours actifs</span></div>
            </div>
          </section>

          <section className="goal-card glass-card">
            <div className="card-heading"><div><p className="eyebrow">OBJECTIF EN COURS</p><h3>Pas encore d’objectif</h3></div><Target size={19} className="gold-icon" /></div>
            <p className="auth-subtitle" style={{ margin: '14px 0 0' }}>Tu pourras fixer un objectif (poids, charge, distance…) dans une prochaine étape.</p>
          </section>

          <section className="coach-card">
            <div className="coach-avatar"><Sparkles size={18} /></div>
            <div><p className="eyebrow">LE MOT DU COACH</p><p>« La constance bat l’intensité. Tu fais exactement ce qu’il faut. »</p></div>
          </section>
        </aside>
      </div>

      <button className="floating-add" onClick={() => setShowAdd(true)} aria-label="Ajouter une activité"><Plus size={25} /></button>

      {showAdd && (
        <Portal>
          <div className="modal-backdrop" onClick={() => setShowAdd(false)}>
            <div className="add-modal glass-card" onClick={(event) => event.stopPropagation()}>
              <div className="modal-head">
                <div><p className="eyebrow accent">NOUVELLE ENTRÉE</p><h2>Qu’est-ce que tu as fait ?</h2></div>
                <button className="icon-button" onClick={() => setShowAdd(false)} aria-label="Fermer"><X size={18} /></button>
              </div>
              <div className="activity-options">
                <AddOption icon={Dumbbell} title="Musculation" subtitle="Séance et séries" href={`/activites/musculation/nouvelle?date=${dateSelectionnee}`} />
                <AddOption icon={Footprints} title="Course à pied" subtitle="Distance et allure" href={`/activites/cardio/nouvelle?date=${dateSelectionnee}&type=FOOTING`} />
                <AddOption icon={Waves} title="Autre cardio" subtitle="Vélo, natation…" href={`/activites/cardio/nouvelle?date=${dateSelectionnee}&type=AUTRE`} />
                <AddOption icon={Scale} title="Mesures" subtitle="Poids et mensurations" href={`/activites/mesures/nouvelle?date=${dateSelectionnee}`} />
                <AddOption icon={HeartPulse} title="Suivi quotidien" subtitle="Pas, sommeil, hydratation…" href={`/activites/suivi/nouvelle?date=${dateSelectionnee}`} />
                <button className="add-option" onClick={marquerRepos} disabled={reposEnCours}>
                  <span className="option-icon"><BedDouble size={20} /></span>
                  <span><strong>Jour de repos</strong><small>Compte pour ta régularité</small></span>
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {aSupprimer && (
        <Portal>
          <div className="confirm-backdrop" onClick={() => !suppressionEnCours && setASupprimer(null)}>
            <div className="confirm-card glass-card" onClick={(event) => event.stopPropagation()}>
              <Trash2 size={22} style={{ color: 'var(--coral-bright)' }} />
              <h2 style={{ fontSize: 17, margin: '10px 0 0' }}>Supprimer « {aSupprimer.titre} » ?</h2>
              <p>Cette action est irréversible.</p>
              <div className="confirm-actions">
                <button onClick={() => setASupprimer(null)} disabled={suppressionEnCours}>Annuler</button>
                <button className="danger" onClick={confirmerSuppression} disabled={suppressionEnCours}>
                  {suppressionEnCours ? 'Suppression…' : 'Supprimer'}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {toast && <div className="toast"><span><Check size={16} /></span> {toast}</div>}
    </DashboardShell>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  unit,
  tendance,
  color,
}: {
  icon: typeof Footprints
  label: string
  value: string
  unit: string
  tendance?: Tendance
  color: string
}) {
  return (
    <article className="metric-card glass-card">
      <div className={`metric-icon ${color}`}><Icon size={17} /></div>
      <span className="metric-label">{label}</span>
      <div className="metric-value">{value} <small>{unit}</small></div>
      {tendance && (
        <span className={`metric-trend ${tendance.hausse ? 'positive' : ''}`}>
          {tendance.hausse ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
          {tendance.hausse ? '+' : ''}{tendance.valeur}
        </span>
      )}
    </article>
  )
}

function AddOption({ icon: Icon, title, subtitle, href }: { icon: typeof Dumbbell; title: string; subtitle: string; href: string }) {
  return (
    <Link className="add-option" href={href}>
      <span className="option-icon"><Icon size={20} /></span>
      <span><strong>{title}</strong><small>{subtitle}</small></span>
      <ChevronRight size={17} />
    </Link>
  )
}
