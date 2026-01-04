"use client";

import { useEffect, useMemo, useState } from "react";
import LogoutButton from "../../../../components/LogoutButton";
import { apiFetch } from "../../../../../lib/api";
import AttemptTable from "./components/AttemptTable";
import Controls from "./components/Controls";

type Attempt = {
  _id: string;
  studentName: string;
  studentEmail: string;
  status: string;
  score?: { correctCount: number; totalQuestions: number };
  flags?: { suspiciousEventsCount: number };
  submittedAt?: string;
};

type Metrics = {
  totalAttempts: number;
  activeAttempts: number;
  averageScore: number;
  lastSubmissionAt?: string | null;
  endAt?: string | null;
  remainingSeconds?: number | null;
  status?: "draft" | "published" | "closed";
};

export default function MonitorPage({ params }: { params: { quizId: string } }) {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const load = () => {
      apiFetch(`/api/quizzes/${params.quizId}/attempts`)
        .then((res) => res.json())
        .then(setAttempts)
        .catch(() => setAttempts([]));
      apiFetch(`/api/quizzes/${params.quizId}/dashboard`)
        .then((res) => res.json())
        .then(setMetrics)
        .catch(() => setMetrics(null));
    };
    load();
    const timer = setInterval(load, 8000);
    return () => clearInterval(timer);
  }, [params.quizId]);

  async function exportCsv() {
    const res = await apiFetch(`/api/quizzes/${params.quizId}/export`);
    if (!res.ok) {
      return;
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `quiz-${params.quizId}-results.csv`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  }

  const filtered = useMemo(() => {
    if (!filter.trim()) return attempts;
    return attempts.filter((attempt) => attempt.studentName.toLowerCase().includes(filter.toLowerCase()));
  }, [attempts, filter]);

  return (
    <main>
      <div className="page-actions">
        <a className="button-secondary" href="/dashboard">Back to Dashboard</a>
        <LogoutButton />
      </div>
      <div className="header-card">
        <h1 className="header-title">Live Monitor</h1>
        <p className="header-subtitle">Track active attempts and suspicious activity.</p>
      </div>
      {metrics ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
          <div className="card">
            <p className="section-title">Total attempts</p>
            <h2 style={{ margin: 0 }}>{metrics.totalAttempts}</h2>
          </div>
          <div className="card">
            <p className="section-title">Active now</p>
            <h2 style={{ margin: 0 }}>{metrics.activeAttempts}</h2>
          </div>
          <div className="card">
            <p className="section-title">Average score</p>
            <h2 style={{ margin: 0 }}>{metrics.averageScore.toFixed(1)}</h2>
          </div>
          <div className="card">
            <p className="section-title">Quiz ends in</p>
            <p style={{ margin: 0 }}>
              {metrics.remainingSeconds == null ? "-" : `${Math.floor(metrics.remainingSeconds / 60)}m ${metrics.remainingSeconds % 60}s`}
            </p>
          </div>
        </div>
      ) : null}
      <Controls
        quizId={params.quizId}
        remainingSeconds={metrics?.remainingSeconds ?? null}
        endAt={metrics?.endAt ?? null}
        status={metrics?.status ?? "draft"}
      />
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <h2 style={{ margin: 0 }}>Attempts</h2>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input
              className="input"
              placeholder="Search by student name"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ width: 320, flex: "0 1 320px" }}
            />
            <button className="button-secondary" onClick={exportCsv} style={{ whiteSpace: "nowrap" }}>
              Export CSV
            </button>
          </div>
        </div>
        <AttemptTable attempts={filtered} quizId={params.quizId} onEnded={() => {
          apiFetch(`/api/quizzes/${params.quizId}/attempts`)
            .then((res) => res.json())
            .then(setAttempts)
            .catch(() => setAttempts([]));
        }} />
      </div>
    </main>
  );
}
