"use client";

import React, { useState } from "react";
import { apiFetch } from "../../../../../../lib/api";

type Attempt = {
  _id: string;
  studentName: string;
  studentEmail: string;
  status: string;
  score?: { correctCount: number; totalQuestions: number };
  flags?: { suspiciousEventsCount: number };
};

type Props = { attempts: Attempt[]; quizId: string; onEnded: () => void };

export default function AttemptTable({ attempts, quizId, onEnded }: Props) {
  const suspiciousThreshold = 5;
  const [ending, setEnding] = useState<Record<string, boolean>>({});
  const [removing, setRemoving] = useState<Record<string, boolean>>({});

  async function endAttempt(attemptId: string) {
    setEnding((prev) => ({ ...prev, [attemptId]: true }));
    await apiFetch(`/api/attempts/${attemptId}/terminate`, { method: "PATCH" });
    setEnding((prev) => ({ ...prev, [attemptId]: false }));
    onEnded();
  }

  async function removeAttempt(attemptId: string) {
    if (!confirm("Remove this response? This cannot be undone.")) {
      return;
    }
    setRemoving((prev) => ({ ...prev, [attemptId]: true }));
    await apiFetch(`/api/attempts/${attemptId}`, { method: "DELETE" });
    setRemoving((prev) => ({ ...prev, [attemptId]: false }));
    onEnded();
  }

  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Student</th>
            <th>Email</th>
            <th>Status</th>
            <th>Score</th>
            <th>Suspicious</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {attempts.map((attempt) => (
            <tr key={attempt._id}>
              <td data-label="Student">
                <a href={`/dashboard/quizzes/${quizId}/monitor/${attempt._id}`}>{attempt.studentName}</a>
              </td>
              <td data-label="Email">{attempt.studentEmail}</td>
              <td data-label="Status">{attempt.status}</td>
              <td data-label="Score">{attempt.score ? `${attempt.score.correctCount}/${attempt.score.totalQuestions}` : "-"}</td>
              <td
                data-label="Suspicious"
                className={attempt.flags && attempt.flags.suspiciousEventsCount >= suspiciousThreshold ? "suspicious" : ""}
              >
                {attempt.flags?.suspiciousEventsCount ?? 0}
              </td>
              <td data-label="Actions">
                <div className="table-actions inline">
                  <button
                    className="button-secondary"
                    onClick={() => endAttempt(attempt._id)}
                    disabled={attempt.status !== "in_progress" || Boolean(ending[attempt._id])}
                  >
                    {attempt.status === "in_progress" ? "End" : "Ended"}
                  </button>
                  <button
                    className="button-secondary"
                    onClick={() => removeAttempt(attempt._id)}
                    disabled={Boolean(removing[attempt._id])}
                  >
                    Remove
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
