"use client";

import { useState } from "react";

export default function FullSiteAuditButton({ query, onResult }) {
  const [status, setStatus] = useState("Ready");

  async function run() {
    if (!query?.trim()) return;
    setStatus("Running full site audit...");
    try {
      const response = await fetch("/api/full-site-audit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: query.trim(), radius: 1000 }) });
      if (!response.ok) throw new Error("Audit failed");
      const result = (await response.json()).data;
      onResult?.(result);
      setStatus(result.status === "site_not_found" ? "Site not found" : "Audit completed — review required");
    } catch (error) {
      console.error(error);
      setStatus("Audit unavailable");
    }
  }

  return <div className="full-audit-control"><button type="button" className="primary-button" onClick={run} disabled={!query?.trim() || status.startsWith("Running")}> {status.startsWith("Running") ? "Auditing..." : "Run Full Site Audit"}</button><small>{status}</small></div>;
}
