import Link from "next/link";

export default function HomePage() {
  return (
    <main className="home-shell">
      <section className="hero-panel">
        <p className="eyebrow">SENTINEL AUTOGARD</p>
        <h1>Physical Security Intelligence Platform</h1>
        <p className="hero-copy">
          Discover opportunities, understand projects, analyze sites, and connect
          AUTOGARD solutions to real-world security requirements.
        </p>
        <div className="module-grid">
          <Link className="module-card active" href="/site-audit">
            <span>01</span>
            <strong>Site Audit</strong>
            <small>Open geospatial workspace</small>
          </Link>
          <div className="module-card"><span>02</span><strong>Project Radar</strong><small>Coming next</small></div>
          <div className="module-card"><span>03</span><strong>Tender Radar</strong><small>Coming next</small></div>
          <div className="module-card"><span>04</span><strong>Company Twin</strong><small>Knowledge foundation</small></div>
        </div>
      </section>
    </main>
  );
}
