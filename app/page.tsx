'use client'

import { useMemo, useState } from 'react'
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  Dumbbell,
  Flame,
  Footprints,
  Gauge,
  HeartPulse,
  MoreHorizontal,
  Plus,
  Scale,
  Settings2,
  Sparkles,
  Timer,
  Trophy,
  Waves,
  X,
  Zap,
} from 'lucide-react'

const days = [
  { label: 'LUN', day: '16', state: 'done' },
  { label: 'MAR', day: '17', state: 'done' },
  { label: 'MER', day: '18', state: 'active' },
  { label: 'JEU', day: '19', state: 'upcoming' },
  { label: 'VEN', day: '20', state: 'upcoming' },
  { label: 'SAM', day: '21', state: 'planned' },
  { label: 'DIM', day: '22', state: 'rest' },
]

const activities = [
  { icon: Dumbbell, title: 'Push — force', meta: 'Musculation · 48 min', value: '4 exercices', color: 'coral' },
  { icon: Footprints, title: 'Marche quotidienne', meta: 'Suivi quotidien · 8 432 pas', value: '6,2 km', color: 'blue' },
]

const bars = [38, 52, 44, 66, 48, 78, 58, 72, 84, 62, 88, 70, 92, 80, 96]

export default function Page() {
  const [activeTab, setActiveTab] = useState('Aujourd’hui')
  const [showAdd, setShowAdd] = useState(false)
  const [toast, setToast] = useState(false)
  const [selectedDay, setSelectedDay] = useState('18')
  const [period, setPeriod] = useState('4 sem.')

  const todayLabel = useMemo(() => selectedDay === '18' ? 'Mercredi 18 juin' : `Journée du ${selectedDay} juin`, [selectedDay])

  function addActivity(title: string) {
    setShowAdd(false)
    setToast(true)
    window.setTimeout(() => setToast(false), 2800)
  }

  return (
    <main className="momentum-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <aside className="sidebar">
        <div className="brand-mark"><span>M</span></div>
        <div className="brand-copy"><strong>momentum</strong><small>ton rythme. ta progression.</small></div>
        <nav className="side-nav" aria-label="Navigation principale">
          {[
            { label: 'Aujourd’hui', icon: Zap },
            { label: 'Calendrier', icon: CalendarDays },
            { label: 'Progression', icon: BarChart3 },
            { label: 'Profil', icon: CircleUserRound },
          ].map(({ label, icon: Icon }) => (
            <button key={label} className={`nav-item ${activeTab === label ? 'selected' : ''}`} onClick={() => setActiveTab(label)}>
              <Icon size={18} strokeWidth={1.8} /><span>{label}</span>{activeTab === label && <i />}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="mini-avatar">JD</div>
          <div><strong>Julien D.</strong><span>Objectif : recomposition</span></div>
          <button className="icon-button" aria-label="Paramètres"><Settings2 size={17} /></button>
        </div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div className="mobile-brand"><div className="brand-mark"><span>M</span></div><strong>momentum</strong></div>
          <div className="topbar-date"><span className="eyebrow">JUIN 2025</span><button className="month-picker">18 <ChevronDown /></button></div>
          <div className="top-actions"><button className="icon-button"><MoreHorizontal size={20} /></button><div className="profile-pill"><div className="mini-avatar">JD</div><span>Julien</span><ChevronRight size={15} /></div></div>
        </header>

        <div className="page-heading">
          <div><p className="eyebrow accent">MERCREDI 18 JUIN</p><h1>On garde le <em>momentum.</em></h1><p className="subheading">Chaque séance compte. Même les petites.</p></div>
          <div className="streak-pill"><Flame size={18} fill="currentColor" /><div><strong>12 jours</strong><span>de régularité</span></div></div>
        </div>

        <div className="week-strip glass-card">
          <button className="circle-arrow" aria-label="Semaine précédente"><ChevronLeft size={18} /></button>
          <div className="week-days">{days.map((item) => <button key={item.day} className={`day-cell ${selectedDay === item.day ? 'current' : ''}`} onClick={() => setSelectedDay(item.day)}><span>{item.label}</span><strong>{item.day}</strong><i className={item.state} /></button>)}</div>
          <button className="circle-arrow" aria-label="Semaine suivante"><ChevronRight size={18} /></button>
          <button className="calendar-button"><CalendarDays size={16} /> <span>Calendrier</span></button>
        </div>

        <div className="dashboard-grid">
          <section className="main-column">
            <div className="section-title"><div><p className="eyebrow">JOUR SÉLECTIONNÉ</p><h2>{todayLabel}</h2></div><button className="compare-button"><ArrowUpRight size={15} /> Comparer</button></div>
            <div className="activity-list">
              {activities.map(({ icon: Icon, title, meta, value, color }) => <article className="activity-card glass-card" key={title}><div className={`activity-icon ${color}`}><Icon size={20} /></div><div className="activity-info"><strong>{title}</strong><span>{meta}</span></div><b>{value}</b><button className="more-button" aria-label={`Options ${title}`}><MoreHorizontal size={17} /></button></article>)}
              <button className="add-activity glass-card" onClick={() => setShowAdd(true)}><span className="plus-icon"><Plus size={21} /></span><span><strong>Ajouter une activité</strong><small>Enregistre ta séance ou ton suivi du jour</small></span><ChevronRight size={18} /></button>
            </div>
            <div className="section-title metrics-title"><div><p className="eyebrow">VUE D’ENSEMBLE</p><h2>Les chiffres du jour</h2></div><button className="text-button">Détails <ChevronRight size={15} /></button></div>
            <div className="metric-grid">
              <MetricCard icon={Footprints} label="Pas" value="8 432" unit="pas" trend="+12%" trendUp color="blue" />
              <MetricCard icon={Timer} label="Sommeil" value="7h 42" unit="bon" trend="+18 min" trendUp color="violet" />
              <MetricCard icon={HeartPulse} label="Hydratation" value="1,8" unit="/ 2,5 L" trend="72%" color="cyan" />
              <MetricCard icon={Gauge} label="Énergie" value="4" unit="/ 5" trend="Très bonne" trendUp color="gold" />
            </div>
          </section>

          <aside className="right-column">
            <section className="progress-card glass-card"><div className="card-heading"><div><p className="eyebrow">PROGRESSION HEBDO</p><h3>Tu es sur la bonne voie</h3></div><span className="sparkle"><Sparkles size={16} /></span></div><div className="progress-ring"><div className="ring-inner"><strong>72%</strong><span>complété</span></div></div><div className="progress-stats"><div><strong>4</strong><span>séances</span></div><div><strong>18,4</strong><span>km parcourus</span></div><div><strong>2</strong><span>records</span></div></div><div className="mini-chart">{bars.map((height, index) => <i key={index} style={{ height: `${height}%` }} className={index === 13 ? 'today-bar' : ''} />)}</div><div className="chart-labels"><span>LUN</span><span>AUJOURD’HUI</span><span>DIM</span></div></section>
            <section className="goal-card glass-card"><div className="card-heading"><div><p className="eyebrow">OBJECTIF EN COURS</p><h3>Développé couché</h3></div><Trophy size={19} className="gold-icon" /></div><div className="goal-values"><strong>82,5 <small>kg</small></strong><span>objectif <b>100 kg</b></span></div><div className="goal-track"><i style={{ width: '68%' }} /></div><div className="goal-footer"><span>68% atteint</span><span>+5 kg ce mois</span></div></section>
            <section className="coach-card"><div className="coach-avatar"><Sparkles size={18} /></div><div><p className="eyebrow">LE MOT DU COACH</p><p>« La constance bat l’intensité. Tu fais exactement ce qu’il faut. »</p></div></section>
          </aside>
        </div>
      </section>

      <button className="floating-add" onClick={() => setShowAdd(true)} aria-label="Ajouter une activité"><Plus size={25} /></button>
      <div className="bottom-nav">{['Aujourd’hui', 'Calendrier', 'Progression', 'Profil'].map((label, index) => { const Icon = [Zap, CalendarDays, BarChart3, CircleUserRound][index]; return <button key={label} className={activeTab === label ? 'active' : ''} onClick={() => setActiveTab(label)}><Icon size={19} /><span>{label}</span></button> })}</div>

      {showAdd && <div className="modal-backdrop" onClick={() => setShowAdd(false)}><div className="add-modal glass-card" onClick={(event) => event.stopPropagation()}><div className="modal-head"><div><p className="eyebrow accent">NOUVELLE ENTRÉE</p><h2>Qu’est-ce que tu as fait ?</h2></div><button className="icon-button" onClick={() => setShowAdd(false)} aria-label="Fermer"><X size={18} /></button></div><div className="activity-options"><AddOption icon={Dumbbell} title="Musculation" subtitle="Séance et séries" onClick={addActivity} /><AddOption icon={Footprints} title="Course à pied" subtitle="Distance et allure" onClick={addActivity} /><AddOption icon={Waves} title="Autre cardio" subtitle="Vélo, natation…" onClick={addActivity} /><AddOption icon={Scale} title="Mesures" subtitle="Poids et mensurations" onClick={addActivity} /></div></div></div>}
      {toast && <div className="toast"><span><Check size={16} /></span> Activité ajoutée à ta journée</div>}
    </main>
  )
}

function MetricCard({ icon: Icon, label, value, unit, trend, trendUp, color }: { icon: typeof Activity; label: string; value: string; unit: string; trend: string; trendUp?: boolean; color: string }) {
  return <article className="metric-card glass-card"><div className={`metric-icon ${color}`}><Icon size={17} /></div><span className="metric-label">{label}</span><div className="metric-value">{value} <small>{unit}</small></div><span className={`metric-trend ${trendUp ? 'positive' : ''}`}>{trendUp && <ArrowUpRight size={13} />}{trend}</span></article>
}

function AddOption({ icon: Icon, title, subtitle, onClick }: { icon: typeof Activity; title: string; subtitle: string; onClick: (title: string) => void }) {
  return <button className="add-option" onClick={() => onClick(title)}><span className="option-icon"><Icon size={20} /></span><span><strong>{title}</strong><small>{subtitle}</small></span><ChevronRight size={17} /></button>
}

function ChevronDown() { return <ChevronRight size={15} className="chevron-down" /> }
