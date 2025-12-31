"use client";

import { useEffect, useMemo, useState } from "react";
import LogoutButton from "../../../../components/LogoutButton";

type AuditItem = {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  studentName?: string | null;
  studentEmail?: string | null;
};

export default function AuditPage({ params }: { params: { quizId: string } }) {
  const [items, setItems] = useState<AuditItem[]>([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetch(`/api/quizzes/${params.quizId}/audit`)
      .then((res) => res.json())
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]));
  }, [params.quizId]);

  const filtered = useMemo(() => {
    if (!filter.trim()) return items;
    const term = filter.toLowerCase();
    return items.filter((item) =>
      `${item.type} ${item.message} ${item.studentName || ""} ${item.studentEmail || ""}`.toLowerCase().includes(term)
    );
  }, [filter, items]);

  return (
    <main>
      <div className="page-actions">
        <a className="button-secondary" href="/dashboard">Back to Dashboard</a>
        <a className="button-secondary" href={`/dashboard/quizzes/${params.quizId}/monitor`}>Back to Monitor</a>
        <LogoutButton />
      </div>
      <div className="header-card">
        <h1 className="header-title">Audit Log</h1>
        <p className="header-subtitle">OTP sends, forced ends, and fullscreen exits.</p>
      </div>
      <div className="card">
        <input
          className="input"
          placeholder="Search audit events"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      <div className="card">
        {filtered.length === 0 ? (
          <p>No audit events yet.</p>
        ) : (
          <div className="table">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Type</th>
                  <th>Message</th>
                  <th>Student</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td>{new Date(item.timestamp).toLocaleString()}</td>
                    <td>{item.type}</td>
                    <td>{item.message}</td>
                    <td>{item.studentName || item.studentEmail || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
