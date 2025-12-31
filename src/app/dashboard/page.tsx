"use client";

import { useEffect, useMemo, useState } from "react";
import LogoutButton from "../components/LogoutButton";

type Quiz = {
  _id: string;
  title: string;
  status: string;
  description?: string;
};

export default function DashboardPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [filter, setFilter] = useState("");

  async function loadQuizzes() {
    const res = await fetch("/api/quizzes");
    const data = await res.json();
    if (Array.isArray(data)) {
      setQuizzes(data);
      return;
    }
    setQuizzes([]);
  }

  useEffect(() => {
    loadQuizzes().catch(() => setQuizzes([]));
  }, []);

  async function updateStatus(quizId: string, status: "draft" | "published" | "closed") {
    await fetch(`/api/quizzes/${quizId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    await loadQuizzes();
  }

  async function removeQuiz(quizId: string) {
    if (!confirm("Delete this quiz and all related data?")) {
      return;
    }
    await fetch(`/api/quizzes/${quizId}`, { method: "DELETE" });
    await loadQuizzes();
  }

  const filtered = useMemo(() => {
    if (!filter.trim()) return quizzes;
    return quizzes.filter((quiz) => quiz.title.toLowerCase().includes(filter.toLowerCase()));
  }, [filter, quizzes]);

  return (
    <main>
      <div className="page-actions">
        <span />
        <LogoutButton />
      </div>
      <div className="header-card">
        <h1 className="header-title">Instructor Dashboard</h1>
        <p className="header-subtitle">Manage your quizzes and monitor results.</p>
      </div>
      <div className="card" style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <input
          className="input"
          placeholder="Search quiz by title"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <a className="button" href="/dashboard/quizzes/new" style={{ whiteSpace: "nowrap" }}>Create Quiz</a>
      </div>
      <div className="table">
        <div className="table-row table-head">
          <div>Quiz</div>
          <div className="status-cell" style={{ paddingLeft: 12 }}>Status</div>
          <div className="actions-cell">Actions</div>
        </div>
        {filtered.map((quiz) => (
          <div className="table-row dashboard-row" key={quiz._id}>
            <div className="quiz-cell">
              <strong>{quiz.title}</strong>
              <div className="section-title" style={{ marginTop: 4 }}>
                <div className="link-row">
                  <a href={`/dashboard/quizzes/${quiz._id}/students`}>Students</a>
                  <span>|</span>
                  <a href={`/dashboard/quizzes/${quiz._id}/questions`}>Questions</a>
                  <span>|</span>
                  <a href={`/dashboard/quizzes/${quiz._id}/monitor`}>Monitor</a>
                  <span>|</span>
                  <a href={`/dashboard/quizzes/${quiz._id}/settings`}>Settings</a>
                  <span>|</span>
                  <a href={`/dashboard/quizzes/${quiz._id}/preview`}>Preview</a>
                  <span>|</span>
                  <a href={`/dashboard/quizzes/${quiz._id}/audit`}>Audit</a>
                </div>
              </div>
            </div>
            <div className="status-cell" style={{ display: "flex", alignItems: "center" }}>
              <span className={`status-badge status-${quiz.status}`}>{quiz.status}</span>
            </div>
            <div className="table-actions inline actions-cell">
              {quiz.status === "draft" ? (
                <button className="button" onClick={() => updateStatus(quiz._id, "published")}>Publish</button>
              ) : quiz.status === "published" ? (
                <button className="button" onClick={() => updateStatus(quiz._id, "closed")}>Close</button>
              ) : (
                <span className="status-badge status-closed">Closed</span>
              )}
              <button className="button-secondary" onClick={() => removeQuiz(quiz._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
