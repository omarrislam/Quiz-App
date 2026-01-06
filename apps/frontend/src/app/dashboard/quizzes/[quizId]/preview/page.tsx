"use client";

import { useEffect, useMemo, useState } from "react";
import LogoutButton from "../../../../components/LogoutButton";
import { apiFetch } from "../../../../../lib/api";

type Question = { id: string; text: string; options: string[] };

type Payload = {
  title: string;
  settings: { questionTimeSeconds: number; shuffleOptions: boolean };
  questions: Question[];
};

const badges = ["A", "B", "C", "D", "E", "F"];

export default function PreviewPage({ params }: { params: { quizId: string } }) {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});

  useEffect(() => {
    apiFetch(`/api/quizzes/${params.quizId}/preview`)
      .then((res) => res.json())
      .then((data) => setPayload(data?.questions ? data : null))
      .catch(() => setPayload(null));
  }, [params.quizId]);

  const current = payload?.questions[index];
  const total = payload?.questions.length || 0;
  const progress = useMemo(() => {
    if (!total) return 0;
    return Math.round((index / total) * 100);
  }, [index, total]);

  function choose(optionIndex: number) {
    if (!current) return;
    setAnswers((prev) => ({ ...prev, [current.id]: optionIndex }));
  }

  function goNext() {
    if (!current) return;
    if (answers[current.id] == null) return;
    if (index + 1 < total) {
      setIndex(index + 1);
      return;
    }
    alert("Preview complete. No responses were saved.");
  }

  if (!payload) {
    return (
      <main>
        <div className="page-actions">
          <a className="button-secondary" href="/dashboard">Back to Dashboard</a>
        </div>
        <div className="header-card">
          <div className="header-card-row">
            <div>
              <h1 className="header-title">Quiz Preview</h1>
              <p className="header-subtitle">Loading preview details.</p>
            </div>
            <div className="header-card-actions">
              <LogoutButton />
            </div>
          </div>
        </div>
        <p>Loading preview...</p>
      </main>
    );
  }

  return (
    <main>
      <div className="page-actions">
        <a className="button-secondary" href="/dashboard">Back to Dashboard</a>
        <a className="button-secondary" href={`/dashboard/quizzes/${params.quizId}/questions`}>Back to Questions</a>
      </div>
      <div className="header-card">
        <div className="header-card-row">
          <div>
            <h1 className="header-title">{payload.title} (Preview)</h1>
            <p className="header-subtitle">This mode does not save responses.</p>
          </div>
          <div className="header-card-actions">
            <LogoutButton />
          </div>
        </div>
      </div>
      {current ? (
        <div className="card">
          <div className="meta-row">
            <span>Question {index + 1} / {total}</span>
            <span className="timer">{payload.settings.questionTimeSeconds}s</span>
          </div>
          <h2 style={{ margin: "6px 0 4px" }}>Question text</h2>
          <div className="progress">
            <div className="progress-bar" style={{ width: `${progress}%` }} />
          </div>
          <p style={{ marginTop: 0 }}>{current.text}</p>
          {current.options.map((opt, idx) => (
            <div
              key={`${current.id}-${idx}`}
              className={`option ${answers[current.id] === idx ? "selected" : ""}`}
              onClick={() => choose(idx)}
              role="button"
              tabIndex={0}
            >
              <span className="option-badge">{badges[idx] || ""}</span>
              <span>{opt}</span>
            </div>
          ))}
          <div className="button-row">
            <button className="button" onClick={goNext} disabled={answers[current.id] == null}>
              {index + 1 === total ? "Finish Preview" : "Next"}
            </button>
            <button className="button-secondary" onClick={() => setIndex(0)}>Restart</button>
            <span className="section-title" style={{ marginLeft: "auto" }}>Progress: {index} / {total}</span>
          </div>
        </div>
      ) : (
        <div className="card">
          <p>No questions available for this quiz.</p>
        </div>
      )}
    </main>
  );
}
