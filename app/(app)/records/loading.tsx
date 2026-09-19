export default function ChargementRecords() {
  return (
    <main className="momentum-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <section className="content">
        <div className="calendar-page-header">
          <div>
            <div className="skeleton skeleton-text" style={{ width: 140 }} />
            <div className="skeleton skeleton-title" />
          </div>
        </div>
        <div className="records-grid">
          {[0, 1, 2, 3].map((i) => <div key={i} className="record-card glass-card skeleton" style={{ minHeight: 110 }} />)}
        </div>
      </section>
    </main>
  )
}
