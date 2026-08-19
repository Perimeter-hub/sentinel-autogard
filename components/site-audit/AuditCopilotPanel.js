"use client";

import { useState } from "react";

export default function AuditCopilotPanel({ objectType, findingType = "", initialParameters = {}, siteConditions = [], trafficIntensity = null, onSolutionCandidates }) {
  const [parameters, setParameters] = useState(initialParameters);
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    try {
      const response = await fetch("/api/audit-copilot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ objectType, findingType, parameters, siteConditions, trafficIntensity }) });
      if (!response.ok) throw new Error("Audit Copilot failed");
      const result = (await response.json()).data;
      setState(result);
      onSolutionCandidates?.(result.solutionCandidates || []);
    } finally { setLoading(false); }
  }

  function update(parameter, value) { setParameters((current) => ({ ...current, [parameter]: value })); }

  return <section className="audit-copilot-panel">
    <div className="finding-header"><div><p className="eyebrow">SENTINEL AI</p><h2>Audit Copilot</h2><p>Automatically determine what is known, what is missing, and what can be recommended.</p></div><button type="button" className="primary-button" onClick={run} disabled={!objectType || loading}>{loading ? "Analyzing..." : "Analyze"}</button></div>
    {state?.nextQuestions?.length > 0 && <div className="finding-form"><strong>Required information</strong>{state.nextQuestions.map((question) => <label key={question.questionId}>{question.label}{question.type === "select" ? <select value={parameters[question.parameter] || ""} onChange={(event) => update(question.parameter, event.target.value)}><option value="">Select...</option>{question.options.map((option) => <option key={option}>{option}</option>)}</select> : question.type === "boolean" ? <input type="checkbox" checked={Boolean(parameters[question.parameter])} onChange={(event) => update(question.parameter, event.target.checked)} /> : <input type="number" value={parameters[question.parameter] || ""} onChange={(event) => update(question.parameter, event.target.value)} placeholder={question.unit} />}</label>)}</div>}
    {state && <div className="audit-summary"><span>Status <strong>{state.status}</strong></span><span>Missing <strong>{state.missingParameters?.length || 0}</strong></span><span>Solutions <strong>{state.solutionCandidates?.length || 0}</strong></span></div>}
    {state?.solutionCandidates?.length > 0 && <div className="observation-list">{state.solutionCandidates.slice(0, 5).map((candidate) => <article className="observation-card" key={candidate.productId}><strong>{candidate.name}</strong><span>{candidate.category} · score {candidate.score}</span><span>{candidate.reasons.join(" · ")}</span></article>)}</div>}
  </section>;
}
