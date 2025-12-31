"use client";

import React, { useEffect, useMemo, useState } from "react";

type Props = { quizId: string; remainingSeconds: number | null; endAt: string | null; status: "draft" | "published" | "closed" };

export default function Controls({ quizId, remainingSeconds, endAt, status }: Props) {
  const [minutes, setMinutes] = useState(10);
  const [displaySeconds, setDisplaySeconds] = useState<number | null>(remainingSeconds);
  const [ending, setEnding] = useState(false);
  const [ended, setEnded] = useState(false);
  const isDisabled = status !== "published" || ended;

  async function endExam() {
    if (ending || isDisabled) return;
    setEnding(true);
    const res = await fetch(`/api/quizzes/${quizId}/terminate`, { method: "PATCH" });
    if (res.ok) {
      setEnded(true);
      setDisplaySeconds(0);
    }
    setEnding(false);
  }

  async function extend() {
    await fetch(`/api/quizzes/${quizId}/extend`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ minutes })
    });
  }

  useEffect(() => {
    if (ended) return;
    setDisplaySeconds(remainingSeconds);
  }, [remainingSeconds, ended]);

  useEffect(() => {
    if (status === "published") {
      setEnded(false);
      return;
    }
    setDisplaySeconds(0);
  }, [status]);

  useEffect(() => {
    if (displaySeconds == null) return;
    if (ended || status !== "published") return;
    const timer = setInterval(() => {
      setDisplaySeconds((prev) => {
        if (prev == null) return prev;
        return Math.max(0, prev - 1);
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [displaySeconds]);

  const timeLeftLabel = useMemo(() => {
    if (displaySeconds == null || displaySeconds < 0) return "-";
    const hours = Math.floor(displaySeconds / 3600);
    const minutes = Math.floor((displaySeconds % 3600) / 60);
    const seconds = displaySeconds % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    return `${minutes}m ${seconds}s`;
  }, [displaySeconds]);

  const endAtLabel = useMemo(() => {
    if (!endAt) return "-";
    const date = new Date(endAt);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString();
  }, [endAt]);

  return (
    <div className="card">
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "minmax(200px, 1fr) minmax(240px, 360px)", alignItems: "center" }}>
        <div>
          <p className="section-title" style={{ marginBottom: 6 }}>Time left</p>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{timeLeftLabel}</div>
          <p className="section-title" style={{ marginTop: 6 }}>Ends at {endAtLabel}</p>
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          <button className="button-danger" onClick={endExam} disabled={ending || isDisabled}>
            {ending ? "Ending..." : "End Exam Now"}
          </button>
          {ending ? (
            <span className="spinner-inline">
              <span className="spinner" />
              <span className="section-title">Ending exam</span>
            </span>
          ) : null}
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr auto" }}>
            <input
              className="input"
              type="number"
              min={1}
              value={minutes}
              onChange={(e) => setMinutes(Math.max(1, Number(e.target.value)))}
              placeholder="Minutes"
              disabled={isDisabled}
            />
            <button className="button" onClick={extend} style={{ whiteSpace: "nowrap" }} disabled={isDisabled}>
              Add time
            </button>
          </div>
          <p className="section-title">{isDisabled ? "Quiz is not active" : "Extend by minutes"}</p>
        </div>
      </div>
    </div>
  );
}
