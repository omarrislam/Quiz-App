"use client";

import { useState } from "react";
import LogoutButton from "../../../components/LogoutButton";
import { apiFetch } from "../../../../lib/api";

export default function NewQuizPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questionTimeSeconds, setQuestionTimeSeconds] = useState(35);
  const [totalTimeSeconds, setTotalTimeSeconds] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [requireFullscreen, setRequireFullscreen] = useState(true);
  const [logSuspiciousActivity, setLogSuspiciousActivity] = useState(true);
  const [enableWebcamSnapshots, setEnableWebcamSnapshots] = useState(false);
  const [creating, setCreating] = useState(false);

  async function submit() {
    setCreating(true);
    const startDate = startAt ? new Date(startAt) : null;
    const endDate = endAt ? new Date(endAt) : null;
    const settings = {
      questionTimeSeconds: Number(questionTimeSeconds) || 35,
      totalTimeSeconds: totalTimeSeconds ? Number(totalTimeSeconds) : null,
      startAt: startDate ? startDate.toISOString() : null,
      endAt: endDate ? endDate.toISOString() : null,
      shuffleQuestions,
      shuffleOptions,
      requireFullscreen,
      logSuspiciousActivity,
      enableWebcamSnapshots
    };

    await apiFetch("/api/quizzes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, settings })
    });
    setCreating(false);
    window.location.href = "/dashboard";
  }

  return (
    <main>
      <div className="page-actions">
        <a className="button-secondary" href="/dashboard">Back to Dashboard</a>
        <LogoutButton />
      </div>
      <h1>Create Quiz</h1>
      <div className="card">
        <input className="input" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <br />
        <br />
        <textarea className="input" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <br />
        <br />
        <p className="section-title">Per-question time (seconds)</p>
        <input className="input" type="number" value={questionTimeSeconds} onChange={(e) => setQuestionTimeSeconds(Number(e.target.value))} />
        <br />
        <br />
        <p className="section-title">Total time (seconds, optional)</p>
        <input className="input" type="number" value={totalTimeSeconds} onChange={(e) => setTotalTimeSeconds(e.target.value)} />
        <br />
        <br />
        <p className="section-title">Start time (optional)</p>
        <input className="input" type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
        <br />
        <br />
        <p className="section-title">End time (optional)</p>
        <input className="input" type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
        <br />
        <br />
        <label>
          <input type="checkbox" checked={shuffleQuestions} onChange={(e) => setShuffleQuestions(e.target.checked)} />
          &nbsp;Shuffle questions
        </label>
        <br />
        <label>
          <input type="checkbox" checked={shuffleOptions} onChange={(e) => setShuffleOptions(e.target.checked)} />
          &nbsp;Shuffle options
        </label>
        <br />
        <label>
          <input type="checkbox" checked={requireFullscreen} onChange={(e) => setRequireFullscreen(e.target.checked)} />
          &nbsp;Require fullscreen (desktop)
        </label>
        <br />
        <label>
          <input type="checkbox" checked={logSuspiciousActivity} onChange={(e) => setLogSuspiciousActivity(e.target.checked)} />
          &nbsp;Log suspicious activity
        </label>
        <br />
        <label>
          <input type="checkbox" checked={enableWebcamSnapshots} onChange={(e) => setEnableWebcamSnapshots(e.target.checked)} />
          &nbsp;Enable webcam snapshots (3 per attempt)
        </label>
        <br />
        <br />
        <div className="button-row">
          <button className="button" onClick={submit} disabled={creating}>
            {creating ? "Creating..." : "Create"}
          </button>
          {creating ? (
            <span className="spinner-inline">
              <span className="spinner" />
              <span className="section-title">Creating quiz</span>
            </span>
          ) : null}
        </div>
      </div>
    </main>
  );
}
