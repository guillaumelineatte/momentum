export default function ChargementAujourdhui() {
  return (
    <main className="momentum-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <section className="content">
        <div className="page-heading">
          <div style={{ flex: 1 }}>
            <div className="skeleton skeleton-text" style={{ width: 120 }} />
            <div className="skeleton skeleton-title" />
            <div className="skeleton skeleton-text" style={{ width: 200 }} />
          </div>
        </div>
        <div className="week-strip glass-card skeleton" style={{ minHeight: 93 }} />
        <div className="dashboard-grid">
          <section className="main-column">
            <div className="activity-list">
              <div className="activity-card glass-card skeleton" style={{ minHeight: 73 }} />
              <div className="activity-card glass-card skeleton" style={{ minHeight: 73 }} />
            </div>
            <div className="metric-grid" style={{ marginTop: 24 }}>
              {[0, 1, 2, 3].map((i) => <div key={i} className="metric-card glass-card skeleton" style={{ minHeight: 145 }} />)}
            </div>
          </section>
          <aside className="right-column">
            <div className="progress-card glass-card skeleton" style={{ minHeight: 260 }} />
            <div className="goal-card glass-card skeleton" style={{ minHeight: 120 }} />
          </aside>
        </div>
      </section>
    </main>
  )
}
