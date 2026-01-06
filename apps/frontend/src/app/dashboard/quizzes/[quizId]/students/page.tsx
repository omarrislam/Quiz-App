"use client";

import { useEffect, useMemo, useState } from "react";
import LogoutButton from "../../../../components/LogoutButton";
import { apiFetch } from "../../../../../lib/api";

type Student = { _id: string; name: string; email: string; externalId?: string | null };

export default function StudentsPage({ params }: { params: { quizId: string } }) {
  const [csv, setCsv] = useState("");
  const [message, setMessage] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [filter, setFilter] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [emailDraft, setEmailDraft] = useState("");
  const [uploading, setUploading] = useState(false);
  const [sendingInvites, setSendingInvites] = useState(false);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);

  async function loadStudents() {
    const res = await apiFetch(`/api/quizzes/${params.quizId}/students`);
    const data = await res.json();
    if (Array.isArray(data)) {
      setStudents(data);
      return;
    }
    setStudents([]);
  }

  useEffect(() => {
    loadStudents().catch(() => setStudents([]));
  }, []);

  async function upload() {
    setMessage("");
    setUploading(true);
    const isJson = csv.trim().startsWith("{");
    const res = await apiFetch(`/api/quizzes/${params.quizId}/students/upload`, {
      method: "POST",
      headers: { "Content-Type": isJson ? "application/json" : "text/csv" },
      body: csv
    });
    const data = await res.json().catch(() => null);
    setUploading(false);
    if (!res.ok) {
      setMessage(data?.error || "Upload failed. Use CSV with headers: Name,Email,StudentId.");
      return;
    }
    setMessage("Upload successful.");
    setCsv("");
    await loadStudents();
  }

  async function sendInvites() {
    setMessage("");
    setSendingInvites(true);
    const res = await apiFetch(`/api/quizzes/${params.quizId}/invitations/send`, {
      method: "POST"
    });
    const data = await res.json().catch(() => null);
    setSendingInvites(false);
    if (!res.ok) {
      setMessage(data?.error || "Failed to send invitations.");
      return;
    }
    setMessage("Invitations sent.");
  }

  async function sendInvite(email: string) {
    setMessage("");
    setSendingEmail(email);
    const res = await apiFetch(`/api/quizzes/${params.quizId}/invitations/send-one`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    const data = await res.json().catch(() => null);
    setSendingEmail(null);
    if (!res.ok) {
      setMessage(data?.error || "Failed to send invitation.");
      return;
    }
    setMessage(`Invitation sent to ${email}.`);
  }

  async function deleteStudent(studentId: string) {
    if (!confirm("Delete this student?")) {
      return;
    }
    await apiFetch(`/api/quizzes/${params.quizId}/students/${studentId}`, { method: "DELETE" });
    await loadStudents();
  }

  async function deleteAll() {
    if (!confirm("Delete all students in this quiz?")) {
      return;
    }
    setDeletingAll(true);
    await apiFetch(`/api/quizzes/${params.quizId}/students`, { method: "DELETE" });
    await loadStudents();
    setDeletingAll(false);
  }

  async function saveEmail(studentId: string) {
    setMessage("");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailDraft)) {
      setMessage("Enter a valid email address.");
      return;
    }
    const res = await apiFetch(`/api/quizzes/${params.quizId}/students/${studentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailDraft })
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setMessage(data?.error || "Failed to update email.");
      return;
    }
    setEditingId(null);
    setEmailDraft("");
    await loadStudents();
  }

  function handleFile(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCsv(String(reader.result || ""));
    };
    reader.readAsText(file);
  }

  const filtered = useMemo(() => {
    if (!filter.trim()) return students;
    return students.filter((student) => student.name.toLowerCase().includes(filter.toLowerCase()));
  }, [filter, students]);

  return (
    <main>
      <div className="page-actions">
        <a className="button-secondary" href="/dashboard">Back to Dashboard</a>
        <LogoutButton />
      </div>
      <h1>Upload Students</h1>
      <div className="card">
        <input type="file" accept=".csv" onChange={(e) => handleFile(e.target.files?.[0] || null)} />
        <br />
        <br />
        <div className="format-hint">
          Accepted format: CSV with headers `Name`, `Email`, `StudentId` (StudentId optional).
          <div className="format-code">Name,Email,StudentId{"\n"}Student 01,student01@example.com,STU-001</div>
        </div>
        <br />
        <textarea className="input" rows={10} value={csv} onChange={(e) => setCsv(e.target.value)} />
        <br />
        <br />
        <div className="button-row">
          <button className="button" onClick={upload} disabled={uploading}>
            {uploading ? "Uploading..." : "Upload"}
          </button>
          <button className="button" onClick={sendInvites} disabled={sendingInvites}>
            {sendingInvites ? "Sending..." : "Send Invitations"}
          </button>
          {uploading ? (
            <span className="spinner-inline">
              <span className="spinner" />
              <span className="section-title">Processing CSV</span>
            </span>
          ) : null}
          {sendingInvites ? (
            <span className="spinner-inline">
              <span className="spinner" />
              <span className="section-title">Sending invites</span>
            </span>
          ) : null}
          {deletingAll ? (
            <span className="spinner-inline">
              <span className="spinner" />
              <span className="section-title">Deleting students</span>
            </span>
          ) : null}
        </div>
        {message ? <p>{message}</p> : null}
      </div>
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <h2 style={{ margin: 0 }}>Current Students</h2>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input
              className="input filter-input"
              placeholder="Search by name"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            <button className="button-secondary" onClick={deleteAll} style={{ whiteSpace: "nowrap" }} disabled={deletingAll}>
              {deletingAll ? "Deleting..." : "Delete All"}
            </button>
          </div>
        </div>
        {filtered.length === 0 ? (
          <p>No students uploaded yet.</p>
        ) : (
          <div className="table">
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Student ID</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((student) => (
                    <tr key={student._id}>
                      <td data-label="Name">{student.name}</td>
                      <td data-label="Email">{student.email}</td>
                      <td data-label="Student ID">{student.externalId || "-"}</td>
                      <td data-label="Actions">
                        {editingId === student._id ? (
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <input
                              className="input"
                              value={emailDraft}
                              onChange={(e) => setEmailDraft(e.target.value)}
                              style={{ minWidth: 220 }}
                            />
                            <button className="button" onClick={() => saveEmail(student._id)}>Save</button>
                            <button
                              className="button-secondary"
                              onClick={() => {
                                setEditingId(null);
                                setEmailDraft("");
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="table-actions inline">
                            <button className="button-secondary" onClick={() => sendInvite(student.email)} disabled={sendingEmail === student.email}>
                              {sendingEmail === student.email ? "Sending..." : "Send Invite"}
                            </button>
                            <button
                              className="button-secondary"
                              onClick={() => {
                                setEditingId(student._id);
                                setEmailDraft(student.email);
                              }}
                            >
                              Edit Email
                            </button>
                            <button className="button-secondary" onClick={() => deleteStudent(student._id)}>
                              X
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
