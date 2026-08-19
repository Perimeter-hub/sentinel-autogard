"use client";

export default function SiteDiscoveryCard({ candidates = [], selected, onSelect }) {
  if (!candidates.length) return null;

  return (
    <section className="discovery-results">
      <div className="finding-header">
        <div>
          <h2>Site Candidates</h2>
          <p>Review the detected location before boundary analysis.</p>
        </div>
      </div>
      <div className="candidate-list">
        {candidates.map((candidate, index) => (
          <button
            type="button"
            key={`${candidate.osmType || "site"}-${candidate.osmId || index}`}
            className={`candidate-card ${selected === index ? "selected" : ""}`}
            onClick={() => onSelect(index)}
          >
            <strong>{candidate.displayName}</strong>
            <small>{candidate.osmType || "location"} · {candidate.latitude.toFixed(6)}, {candidate.longitude.toFixed(6)}</small>
          </button>
        ))}
      </div>
    </section>
  );
}
