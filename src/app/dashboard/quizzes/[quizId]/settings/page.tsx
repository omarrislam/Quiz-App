"use client";

import { useEffect, useState } from "react";
import LogoutButton from "../../../../components/LogoutButton";

type QuizSettings = {
  questionTimeSeconds: number;
  totalTimeSeconds: number | null;
  startAt: string | null;
  endAt: string | null;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  requireFullscreen: boolean;
  logSuspiciousActivity: boolean;
  enableWebcamSnapshots: boolean;
};

export default function QuizSettingsPage({ params }: { params: { quizId: string } }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [settings, setSettings] = useState<QuizSettings>({
    questionTimeSeconds: 35,
    totalTimeSeconds: null,
    startAt: null,
    endAt: null,
    shuffleQuestions: true,
    shuffleOptions: true,
    requireFullscreen: true,
    logSuspiciousActivity: true,
    enableWebcamSnapshots: false
  });
  const [message, setMessage] = useState("");

  function toLocalDateTime(value: string | null) {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    const pad = (num: number) => String(num).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  useEffect(() => {
    fetch(`/api/quizzes/${params.quizId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.title) {
          setTitle(data.title);
          setDescription(data.description || "");
          setSettings({
            questionTimeSeconds: data.settings?.questionTimeSeconds || 35,
            totalTimeSeconds: data.settings?.totalTimeSeconds || null,
            startAt: toLocalDateTime(data.settings?.startAt || null),
            endAt: toLocalDateTime(data.settings?.endAt || null),
            shuffleQuestions: Boolean(data.settings?.shuffleQuestions),
            shuffleOptions: Boolean(data.settings?.shuffleOptions),
            requireFullscreen: Boolean(data.settings?.requireFullscreen),
            logSuspiciousActivity: Boolean(data.settings?.logSuspiciousActivity),
            enableWebcamSnapshots: Boolean(data.settings?.enableWebcamSnapshots)
          });
        }
      })
      .catch(() => {});
  }, [params.quizId]);

  async function save() {
    setMessage("");
    const startAt = settings.startAt ? new Date(settings.startAt) : null;
    const endAt = settings.endAt ? new Date(settings.endAt) : null;
    const payload = {
      title,
      description,
      settings: {
        ...settings,
        totalTimeSeconds: settings.totalTimeSeconds ? Number(settings.totalTimeSeconds) : null,
        startAt: startAt ? startAt.toISOString() : null,
        endAt: endAt ? endAt.toISOString() : null
      }
    };
    const res = await fetch(`/api/quizzes/${params.quizId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    setMessage(res.ok ? "Saved." : "Save failed.");
  }

  return (
    <main>
      <div className="page-actions">
        <a className="button-secondary" href="/dashboard">Back to Dashboard</a>
        <LogoutButton />
      </div>
      <div className="header-card">
        <h1 className="header-title">Quiz Settings</h1>
        <p className="header-subtitle">Update timing and security options.</p>
      </div>
      <div className="card">
        <p className="section-title">Title</p>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        <br />
        <br />
        <p className="section-title">Description</p>
        <textarea className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
        <br />
        <br />
        <p className="section-title">Per-question time (seconds)</p>
        <input
          className="input"
          type="number"
          value={settings.questionTimeSeconds}
          onChange={(e) => setSettings({ ...settings, questionTimeSeconds: Number(e.target.value) })}
        />
        <br />
        <br />
        <p className="section-title">Total time (seconds, optional)</p>
        <input
          className="input"
          type="number"
          value={settings.totalTimeSeconds || ""}
          onChange={(e) => setSettings({ ...settings, totalTimeSeconds: e.target.value ? Number(e.target.value) : null })}
        />
        <br />
        <br />
        <p className="section-title">Start time (optional)</p>
        <input
          className="input"
          type="datetime-local"
          value={settings.startAt || ""}
          onChange={(e) => setSettings({ ...settings, startAt: e.target.value })}
        />
        <br />
        <br />
        <p className="section-title">End time (optional)</p>
        <input
          className="input"
          type="datetime-local"
          value={settings.endAt || ""}
          onChange={(e) => setSettings({ ...settings, endAt: e.target.value })}
        />
        <br />
        <br />
        <label>
          <input
            type="checkbox"
            checked={settings.shuffleQuestions}
            onChange={(e) => setSettings({ ...settings, shuffleQuestions: e.target.checked })}
          />
          &nbsp;Shuffle questions
        </label>
        <br />
        <label>
          <input
            type="checkbox"
            checked={settings.shuffleOptions}
            onChange={(e) => setSettings({ ...settings, shuffleOptions: e.target.checked })}
          />
          &nbsp;Shuffle options
        </label>
        <br />
        <label>
          <input
            type="checkbox"
            checked={settings.requireFullscreen}
            onChange={(e) => setSettings({ ...settings, requireFullscreen: e.target.checked })}
          />
          &nbsp;Require fullscreen (desktop)
        </label>
        <br />
        <label>
          <input
            type="checkbox"
            checked={settings.logSuspiciousActivity}
            onChange={(e) => setSettings({ ...settings, logSuspiciousActivity: e.target.checked })}
          />
          &nbsp;Log suspicious activity
        </label>
        <br />
        <label>
          <input
            type="checkbox"
            checked={settings.enableWebcamSnapshots}
            onChange={(e) => setSettings({ ...settings, enableWebcamSnapshots: e.target.checked })}
          />
          &nbsp;Enable webcam snapshots (3 per attempt)
        </label>
        <br />
        <br />
        <button className="button" onClick={save}>Save changes</button>
        {message ? <p>{message}</p> : null}
      </div>
    </main>
  );
}
