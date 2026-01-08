"use client";

import { useEffect, useState } from "react";
import LogoutButton from "../../../../components/LogoutButton";
import { apiFetch } from "../../../../../lib/api";

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
  enableFaceCentering: boolean;
  enableSecondCam: boolean;
  mobileAllowed: boolean;
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
    enableWebcamSnapshots: false,
    enableFaceCentering: false,
    enableSecondCam: false,
    mobileAllowed: true
  });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  function toLocalDateTime(value: string | null) {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    const pad = (num: number) => String(num).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  useEffect(() => {
    apiFetch(`/api/quizzes/${params.quizId}`)
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
            enableWebcamSnapshots: Boolean(data.settings?.enableWebcamSnapshots),
            enableFaceCentering: Boolean(data.settings?.enableFaceCentering),
            enableSecondCam: Boolean(data.settings?.enableSecondCam),
            mobileAllowed: data.settings?.mobileAllowed !== false
          });
        }
      })
      .catch(() => {});
  }, [params.quizId]);

  function toggleMobileAllowed(value: boolean) {
    if (value) {
      setSettings({
        ...settings,
        mobileAllowed: true,
        enableFaceCentering: false,
        enableSecondCam: false
      });
      return;
    }
    setSettings({ ...settings, mobileAllowed: false });
  }

  async function save() {
    setMessage("");
    setSaving(true);
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
    const res = await apiFetch(`/api/quizzes/${params.quizId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    setSaving(false);
    setMessage(res.ok ? "Saved." : "Save failed.");
  }

  return (
    <main>
      <div className="page-actions">
        <a className="button-secondary" href="/dashboard">Back to Dashboard</a>
      </div>
      <div className="header-card">
        <div className="header-card-row">
          <div>
            <h1 className="header-title">Quiz Settings</h1>
            <p className="header-subtitle">Update timing and security options.</p>
          </div>
          <div className="header-card-actions">
            <LogoutButton />
          </div>
        </div>
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
        <label>
          <input
            type="checkbox"
            checked={settings.enableFaceCentering}
            onChange={(e) => setSettings({ ...settings, enableFaceCentering: e.target.checked })}
            disabled={settings.mobileAllowed}
          />
          &nbsp;Require face centered during exam
        </label>
        <br />
        <label>
          <input
            type="checkbox"
            checked={settings.enableSecondCam}
            onChange={(e) => setSettings({ ...settings, enableSecondCam: e.target.checked })}
            disabled={settings.mobileAllowed}
          />
          &nbsp;Require second camera (mobile QR)
        </label>
        <br />
        <label>
          <input
            type="checkbox"
            checked={settings.mobileAllowed}
            onChange={(e) => toggleMobileAllowed(e.target.checked)}
          />
          &nbsp;Allow students to join from mobile (disables face centering + second cam)
        </label>
        <br />
        <br />
        <div className="button-row">
          <button className="button" onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </button>
          {saving ? (
            <span className="spinner-inline">
              <span className="spinner" />
              <span className="section-title">Saving settings</span>
            </span>
          ) : null}
        </div>
        {message ? <p>{message}</p> : null}
      </div>
    </main>
  );
}
