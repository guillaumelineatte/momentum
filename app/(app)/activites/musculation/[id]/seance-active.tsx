'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check,
  ChevronLeft,
  Copy,
  Dumbbell,
  Minus,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import {
  ajouterSerieAction,
  dupliquerSerieAction,
  supprimerSerieMusculationAction,
  creerExercicePersonnaliseAction,
  getInfosExerciceAction,
  terminerSeanceAction,
  abandonnerSeanceAction,
} from '../actions'
import { LABELS_TYPE_SEANCE } from '@/lib/labels'
import { GROUPES_MUSCULAIRES } from '@/lib/validations/musculation'
import { Portal } from '@/components/portal'

type Exercice = { id: string; nom: string; groupeMusculaire: string; personnalise?: boolean }
type SetInfo = { id: string; ordre: number; repetitions: number; chargeKg: number; rpe: number | null; note: string | null; exercice: Exercice }
type Perf = { reps: number; chargeKg: number; date: string } | null

const LABELS_GROUPE = new Map<string, string>(GROUPES_MUSCULAIRES.map((g) => [g.value, g.label]))
const DUREE_REPOS_DEFAUT = 90

function formatChrono(secondes: number) {
  const h = Math.floor(secondes / 3600)
  const m = Math.floor((secondes % 3600) / 60)
  const s = secondes % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

export function SeanceActive({
  seance,
  sets,
  bibliotheque,
  exercicesFrequents,
  dernieresPerformances,
  records,
}: {
  seance: { id: string; type: string; nomPersonnalise: string | null; dateDebutISO: string }
  sets: SetInfo[]
  bibliotheque: Exercice[]
  exercicesFrequents: string[]
  dernieresPerformances: Record<string, { reps: number; chargeKg: number; date: string }>
  records: Record<string, number>
}) {
  const titre = seance.nomPersonnalise || LABELS_TYPE_SEANCE[seance.type] || 'Séance'

  // ——— Chrono ———
  const [chrono, setChrono] = useState(() => Math.floor((Date.now() - new Date(seance.dateDebutISO).getTime()) / 1000))
  useEffect(() => {
    const id = window.setInterval(() => {
      setChrono(Math.floor((Date.now() - new Date(seance.dateDebutISO).getTime()) / 1000))
    }, 1000)
    return () => window.clearInterval(id)
  }, [seance.dateDebutISO])

  // ——— Exercices affichés : ceux avec au moins une série + ceux "en attente" (juste ajoutés) ———
  const exercicesAvecSets = useMemo(() => {
    const ordre: string[] = []
    const parExercice = new Map<string, SetInfo[]>()
    for (const s of sets) {
      if (!parExercice.has(s.exercice.id)) {
        parExercice.set(s.exercice.id, [])
        ordre.push(s.exercice.id)
      }
      parExercice.get(s.exercice.id)!.push(s)
    }
    return ordre.map((id) => ({ exercice: parExercice.get(id)![0].exercice, sets: parExercice.get(id)! }))
  }, [sets])

  const [exercicesEnAttente, setExercicesEnAttente] = useState<{ exercice: Exercice; perf: Perf; record: number | null }[]>([])
  const idsAffiches = new Set([...exercicesAvecSets.map((e) => e.exercice.id), ...exercicesEnAttente.map((e) => e.exercice.id)])

  // Un exercice "en attente" qui reçoit sa 1ère série apparaît ensuite via `sets` -> on le retire des en-attente.
  useEffect(() => {
    setExercicesEnAttente((prev) => prev.filter((e) => !sets.some((s) => s.exercice.id === e.exercice.id)))
  }, [sets])

  const perfsConnues: Record<string, Perf> = { ...dernieresPerformances }
  for (const e of exercicesEnAttente) perfsConnues[e.exercice.id] = e.perf
  const recordsConnus: Record<string, number | null> = { ...records }
  for (const e of exercicesEnAttente) recordsConnus[e.exercice.id] = e.record

  // ——— Repos ———
  const [dureeRepos, setDureeRepos] = useState(DUREE_REPOS_DEFAUT)
  const [reposRestant, setReposRestant] = useState<number | null>(null)
  useEffect(() => {
    try {
      const sauvegarde = window.localStorage.getItem('momentum-duree-repos')
      if (sauvegarde) setDureeRepos(Number(sauvegarde))
    } catch {
      // localStorage indisponible (navigation privée…) -> on garde la valeur par défaut
    }
  }, [])
  useEffect(() => {
    if (reposRestant === null) return
    if (reposRestant <= 0) {
      try { navigator.vibrate?.(200) } catch {}
      setReposRestant(null)
      return
    }
    const id = window.setTimeout(() => setReposRestant((r) => (r === null ? null : r - 1)), 1000)
    return () => window.clearTimeout(id)
  }, [reposRestant])

  function ajusterDureeRepos(delta: number) {
    const nouvelle = Math.max(15, dureeRepos + delta)
    setDureeRepos(nouvelle)
    try { window.localStorage.setItem('momentum-duree-repos', String(nouvelle)) } catch {}
    if (reposRestant !== null) setReposRestant((r) => Math.max(0, (r ?? 0) + delta))
  }

  // ——— Picker d'exercice ———
  const [showPicker, setShowPicker] = useState(false)
  const [recherche, setRecherche] = useState('')
  const [groupeFiltre, setGroupeFiltre] = useState<string | null>(null)
  const [creationEnCours, setCreationEnCours] = useState(false)

  const bibliothequeFiltree = useMemo(() => {
    const q = recherche.trim().toLowerCase()
    return bibliotheque
      .filter((e) => !groupeFiltre || e.groupeMusculaire === groupeFiltre)
      .filter((e) => !q || e.nom.toLowerCase().includes(q))
      .sort((a, b) => {
        const fa = exercicesFrequents.includes(a.id) ? 0 : 1
        const fb = exercicesFrequents.includes(b.id) ? 0 : 1
        if (fa !== fb) return fa - fb
        return a.nom.localeCompare(b.nom, 'fr')
      })
  }, [bibliotheque, recherche, groupeFiltre, exercicesFrequents])

  async function choisirExercice(exercice: Exercice) {
    setShowPicker(false)
    setRecherche('')
    if (idsAffiches.has(exercice.id)) return
    const infos = await getInfosExerciceAction(exercice.id, seance.id).catch(() => ({ dernierePerformance: null, record: null }))
    setExercicesEnAttente((prev) => [
      ...prev,
      {
        exercice,
        perf: infos.dernierePerformance ? { ...infos.dernierePerformance, date: String(infos.dernierePerformance.date) } : null,
        record: infos.record,
      },
    ])
  }

  async function creerEtChoisirExercice(nom: string, groupeMusculaire: string) {
    setCreationEnCours(true)
    try {
      const exercice = await creerExercicePersonnaliseAction(nom, groupeMusculaire)
      await choisirExercice({ id: exercice.id, nom: exercice.nom, groupeMusculaire: exercice.groupeMusculaire, personnalise: true })
    } finally {
      setCreationEnCours(false)
    }
  }

  // ——— Fin de séance ———
  const [finEnCours, setFinEnCours] = useState(false)
  const [confirmerAbandon, setConfirmerAbandon] = useState(false)

  async function terminer() {
    setFinEnCours(true)
    await terminerSeanceAction(seance.id, chrono)
  }

  const totalSeries = sets.length

  return (
    <main className="seance-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="seance-topbar">
        <button className="icon-button" onClick={() => setConfirmerAbandon(true)} aria-label="Abandonner la séance"><ChevronLeft size={20} /></button>
        <div className="seance-topbar-info">
          <strong>{titre}</strong>
          <span style={{ fontSize: 10, color: 'var(--muted-2)' }}>{totalSeries} série{totalSeries > 1 ? 's' : ''}</span>
        </div>
        <div className="seance-chrono">{formatChrono(chrono)}</div>
        <div className="seance-topbar-actions">
          <button className="form-submit" style={{ width: 'auto', height: 38, padding: '0 16px', fontSize: 12 }} onClick={terminer} disabled={finEnCours || totalSeries === 0}>
            {finEnCours ? '…' : 'Terminer'}
          </button>
        </div>
      </header>

      <div className="seance-body">
        {exercicesAvecSets.map(({ exercice, sets: setsExercice }) => (
          <ExerciceCard
            key={exercice.id}
            exercice={exercice}
            sets={setsExercice}
            perf={perfsConnues[exercice.id] ?? null}
            record={recordsConnus[exercice.id] ?? null}
            workoutSessionId={seance.id}
            onSerieValidee={(duree) => setReposRestant(duree)}
            dureeRepos={dureeRepos}
          />
        ))}

        {exercicesEnAttente.map(({ exercice, perf, record }) => (
          <ExerciceCard
            key={exercice.id}
            exercice={exercice}
            sets={[]}
            perf={perf}
            record={record}
            workoutSessionId={seance.id}
            onSerieValidee={(duree) => setReposRestant(duree)}
            dureeRepos={dureeRepos}
          />
        ))}

        {exercicesAvecSets.length === 0 && exercicesEnAttente.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon"><Dumbbell size={17} /></div>
            Ajoute un premier exercice pour commencer ta séance.
          </div>
        )}

        <button className="ajouter-exercice-btn" onClick={() => setShowPicker(true)}>
          <Plus size={18} /> Ajouter un exercice
        </button>
      </div>

      {showPicker && (
        <Portal>
          <div className="exo-picker-backdrop" onClick={() => setShowPicker(false)}>
            <div className="exo-picker glass-card" onClick={(e) => e.stopPropagation()}>
              <div className="exo-picker-head">
                <h2 style={{ fontSize: 18, margin: 0 }}>Choisir un exercice</h2>
                <button className="icon-button" onClick={() => setShowPicker(false)} aria-label="Fermer"><X size={18} /></button>
              </div>
              <div className="exo-picker-search form-field" style={{ marginBottom: 0 }}>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: 14, top: 15, color: 'var(--muted-2)' }} />
                  <input
                    className="form-input"
                    style={{ paddingLeft: 38 }}
                    placeholder="Rechercher un exercice…"
                    value={recherche}
                    onChange={(e) => setRecherche(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
              <div className="exo-picker-groupes">
                <button className={!groupeFiltre ? 'active' : ''} onClick={() => setGroupeFiltre(null)}>Tous</button>
                {GROUPES_MUSCULAIRES.map((g) => (
                  <button key={g.value} className={groupeFiltre === g.value ? 'active' : ''} onClick={() => setGroupeFiltre(g.value)}>
                    {g.label}
                  </button>
                ))}
              </div>
              <div className="exo-picker-list">
                {bibliothequeFiltree.map((e) => (
                  <button key={e.id} className="exo-picker-item" onClick={() => choisirExercice(e)}>
                    <span>
                      {e.nom}
                      <small>{LABELS_GROUPE.get(e.groupeMusculaire) ?? e.groupeMusculaire}{e.personnalise ? ' · perso' : ''}</small>
                    </span>
                    {exercicesFrequents.includes(e.id) && <span className="frequent">fréquent</span>}
                  </button>
                ))}
                {bibliothequeFiltree.length === 0 && (
                  <p style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', padding: '20px 0' }}>Aucun exercice trouvé.</p>
                )}
                <CreerExerciceInline recherche={recherche} onCreer={creerEtChoisirExercice} enCours={creationEnCours} />
              </div>
            </div>
          </div>
        </Portal>
      )}

      {reposRestant !== null && (
        <Portal>
          <div className="repos-overlay">
            <div className="repos-card glass-card">
              <div className="repos-time">{formatChrono(reposRestant)}</div>
              <span style={{ fontSize: 11, color: 'var(--muted)', flex: 1 }}>Repos</span>
              <div className="repos-controls">
                <button onClick={() => ajusterDureeRepos(-15)}>-15s</button>
                <button onClick={() => ajusterDureeRepos(15)}>+15s</button>
                <button onClick={() => setReposRestant(null)}>Passer</button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {confirmerAbandon && (
        <Portal>
          <div className="confirm-backdrop" onClick={() => setConfirmerAbandon(false)}>
            <div className="confirm-card glass-card" onClick={(e) => e.stopPropagation()}>
              <h2 style={{ fontSize: 17, margin: 0 }}>Abandonner cette séance ?</h2>
              <p>{totalSeries > 0 ? `${totalSeries} série${totalSeries > 1 ? 's' : ''} déjà enregistrée${totalSeries > 1 ? 's' : ''} seront perdues.` : 'Rien n’a encore été enregistré.'}</p>
              <div className="confirm-actions">
                <button onClick={() => setConfirmerAbandon(false)}>Continuer la séance</button>
                <button className="danger" onClick={() => abandonnerSeanceAction(seance.id)}>Abandonner</button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </main>
  )
}

function CreerExerciceInline({ recherche, onCreer, enCours }: { recherche: string; onCreer: (nom: string, groupe: string) => void; enCours: boolean }) {
  const [ouvert, setOuvert] = useState(false)
  const [nom, setNom] = useState('')
  const [groupe, setGroupe] = useState<string>(GROUPES_MUSCULAIRES[0].value)

  useEffect(() => {
    if (recherche) setNom(recherche)
  }, [recherche])

  if (!ouvert) {
    return (
      <button className="add-option" onClick={() => setOuvert(true)} style={{ marginTop: 4 }}>
        <span className="option-icon"><Plus size={18} /></span>
        <span><strong>Créer un exercice</strong><small>Il ne sera visible que par toi</small></span>
      </button>
    )
  }

  return (
    <div className="exo-picker-creer">
      <div className="form-field" style={{ marginBottom: 10 }}>
        <label>Nom de l'exercice</label>
        <input className="form-input" value={nom} onChange={(e) => setNom(e.target.value)} maxLength={80} autoFocus />
      </div>
      <div className="form-field" style={{ marginBottom: 10 }}>
        <label>Groupe musculaire</label>
        <select className="form-select" value={groupe} onChange={(e) => setGroupe(e.target.value)}>
          {GROUPES_MUSCULAIRES.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
        </select>
      </div>
      <button className="form-submit" disabled={!nom.trim() || enCours} onClick={() => onCreer(nom.trim(), groupe)}>
        {enCours ? 'Création…' : 'Créer et ajouter'}
      </button>
    </div>
  )
}

function ExerciceCard({
  exercice,
  sets,
  perf,
  record,
  workoutSessionId,
  onSerieValidee,
  dureeRepos,
}: {
  exercice: Exercice
  sets: SetInfo[]
  perf: Perf
  record: number | null
  workoutSessionId: string
  onSerieValidee: (dureeRepos: number) => void
  dureeRepos: number
}) {
  const derniereSerie = sets[sets.length - 1]
  const [reps, setReps] = useState(derniereSerie?.repetitions ?? perf?.reps ?? 8)
  const [charge, setCharge] = useState(derniereSerie?.chargeKg ?? perf?.chargeKg ?? 20)
  const [rpe, setRpe] = useState<string>('')
  const [note, setNote] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [suppressionId, setSuppressionId] = useState<string | null>(null)

  async function valider() {
    setEnCours(true)
    try {
      await ajouterSerieAction({
        workoutSessionId,
        exerciseId: exercice.id,
        repetitions: reps,
        chargeKg: charge,
        rpe: rpe ? Number(rpe) : undefined,
        note: note || undefined,
      })
      setNote('')
      try { navigator.vibrate?.(30) } catch {}
      onSerieValidee(dureeRepos)
    } finally {
      setEnCours(false)
    }
  }

  async function dupliquer(setId: string) {
    await dupliquerSerieAction(setId)
    onSerieValidee(dureeRepos)
  }

  async function supprimer(setId: string) {
    setSuppressionId(setId)
    try {
      await supprimerSerieMusculationAction(setId)
    } finally {
      setSuppressionId(null)
    }
  }

  return (
    <article className="exercice-card glass-card">
      <div className="exercice-card-head">
        <div>
          <h3>{exercice.nom}</h3>
          <span className="groupe">{LABELS_GROUPE.get(exercice.groupeMusculaire) ?? exercice.groupeMusculaire}</span>
        </div>
        <Dumbbell size={17} style={{ color: 'var(--coral-bright)' }} />
      </div>

      {perf && (
        <p className="derniere-perf">Dernière fois : <strong>{perf.reps} × {perf.chargeKg} kg</strong></p>
      )}

      <AnimatePresence initial={false}>
        {sets.map((s, i) => (
          <motion.div
            key={s.id}
            layout
            initial={{ opacity: 0, scale: 0.92, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className={`set-row ${record != null && s.chargeKg > record ? 'record' : ''}`}
          >
            <span className="set-numero">#{i + 1}</span>
            <span className="set-valeurs">
              <span><b>{s.repetitions}</b> <span>reps</span></span>
              <span><b>{s.chargeKg}</b> <span>kg</span></span>
              {s.rpe != null && <span><b>{s.rpe}</b> <span>rpe</span></span>}
            </span>
            <span className="set-actions">
              <button onClick={() => dupliquer(s.id)} aria-label="Dupliquer cette série" title="Dupliquer"><Copy size={14} /></button>
              <button onClick={() => supprimer(s.id)} aria-label="Supprimer cette série" title="Supprimer" disabled={suppressionId === s.id}><Trash2 size={14} /></button>
            </span>
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="set-form">
        <div className="stepper-row">
          <div className="stepper">
            <button type="button" onClick={() => setReps((r) => Math.max(1, r - 1))} aria-label="Moins de répétitions"><Minus size={16} /></button>
            <div className="stepper-value"><strong>{reps}</strong><span>reps</span></div>
            <button type="button" onClick={() => setReps((r) => r + 1)} aria-label="Plus de répétitions"><Plus size={16} /></button>
          </div>
          <div className="stepper">
            <button type="button" onClick={() => setCharge((c) => Math.max(0, c - 2.5))} aria-label="Moins de charge"><Minus size={16} /></button>
            <div className="stepper-value"><strong>{charge}</strong><span>kg</span></div>
            <button type="button" onClick={() => setCharge((c) => c + 2.5)} aria-label="Plus de charge"><Plus size={16} /></button>
          </div>
        </div>
        <div className="set-form-extra">
          <div className="form-field">
            <label>RPE (optionnel)</label>
            <select className="form-select" value={rpe} onChange={(e) => setRpe(e.target.value)}>
              <option value="">—</option>
              {[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label>Note (optionnel)</label>
            <input className="form-input" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} />
          </div>
        </div>
        <button className="set-valider" onClick={valider} disabled={enCours}>
          <Check size={16} style={{ marginRight: 6, verticalAlign: -2 }} />
          {enCours ? 'Enregistrement…' : `Valider la série ${sets.length + 1}`}
        </button>
      </div>
    </article>
  )
}
