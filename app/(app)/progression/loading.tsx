export default function ChargementProgression() {
  return (
    <main className="momentum-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <section className="content">
        <div className="calendar-page-header">
          <div>
            <div className="skeleton skeleton-text" style={{ width: 100 }} />
            <div className="skeleton skeleton-title" />
          </div>
        </div>
        <div className="chart-card glass-card skeleton" style={{ minHeight: 320 }} />
        <div className="goal-cards-grid">
          <div className="goal-progress-card glass-card skeleton" style={{ minHeight: 110 }} />
          <div className="goal-progress-card glass-card skeleton" style={{ minHeight: 110 }} />
        </div>
      </section>
    </main>
  )
}
