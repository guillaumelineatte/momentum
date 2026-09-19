export default function ChargementCalendrier() {
  const jours = Array.from({ length: 35 })
  return (
    <main className="momentum-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <section className="content">
        <div className="calendar-page-header">
          <div>
            <div className="skeleton skeleton-text" style={{ width: 90 }} />
            <div className="skeleton skeleton-title" />
          </div>
        </div>
        <div className="calendar-grid">
          {jours.map((_, i) => <div key={i} className="calendar-cell skeleton" />)}
        </div>
      </section>
    </main>
  )
}
