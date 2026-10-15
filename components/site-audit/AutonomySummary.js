"use client";

export default function AutonomySummary({ items = [] }) {
  const counts = items.reduce((result, item) => { const key = item.autonomyDecision || "review_queue"; result[key] = (result[key] || 0) + 1; return result; }, {});
  return <section className="audit-summary autonomy-summary"><span>Auto-accepted <strong>{counts.auto_accept || 0}</strong></span><span>Review queue <strong>{counts.review_queue || 0}</strong></span><span>Mandatory validation <strong>{counts.mandatory_human_validation || 0}</strong></span><span>Engineering validation <strong>{counts.recommend_only_engineering_validation_required || 0}</strong></span></section>;
}
