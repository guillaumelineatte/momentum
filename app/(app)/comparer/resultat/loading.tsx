export default function ChargementComparaison() {
  return (
    <main className="momentum-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <section className="content">
        <div className="compare-header">
          <div className="jour skeleton" style={{ height: 40 }} />
          <div className="vs" />
          <div className="jour skeleton" style={{ height: 40 }} />
        </div>
        <div style={{ maxWidth: 640, margin: '0 auto', width: '100%' }}>
          <div className="compare-group glass-card skeleton" style={{ minHeight: 140 }} />
          <div className="compare-group glass-card skeleton" style={{ minHeight: 140, marginTop: 14 }} />
        </div>
      </section>
    </main>
  )
}
