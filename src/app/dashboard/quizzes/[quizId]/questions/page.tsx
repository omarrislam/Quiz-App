"use client";

import { useEffect, useMemo, useState } from "react";
import LogoutButton from "../../../../components/LogoutButton";

type Question = { _id: string; text: string; options: string[]; correctIndex?: number };

export default function QuestionsPage({ params }: { params: { quizId: string } }) {
  const [csv, setCsv] = useState("");
  const [message, setMessage] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filter, setFilter] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editOptions, setEditOptions] = useState<string[]>(["", "", "", ""]);
  const [editCorrect, setEditCorrect] = useState("A");
  const [uploading, setUploading] = useState(false);

  async function loadQuestions() {
    const res = await fetch(`/api/quizzes/${params.quizId}/questions`);
    const data = await res.json();
    if (Array.isArray(data)) {
      setQuestions(data);
      return;
    }
    setQuestions([]);
  }

  useEffect(() => {
    loadQuestions().catch(() => setQuestions([]));
  }, []);

  async function upload() {
    setMessage("");
    setUploading(true);
    const isJson = csv.trim().startsWith("{");
    const res = await fetch(`/api/quizzes/${params.quizId}/questions/upload`, {
      method: "POST",
      headers: { "Content-Type": isJson ? "application/json" : "text/csv" },
      body: csv
    });
    const data = await res.json().catch(() => null);
    setUploading(false);
    if (!res.ok) {
      setMessage(data?.error || "Upload failed. Use CSV/XLSX with headers: Question,OptionA,OptionB,OptionC,OptionD,CorrectLetter.");
      return;
    }
    setMessage("Upload successful.");
    setCsv("");
    await loadQuestions();
  }

  async function saveQuestion(questionId: string) {
    setMessage("");
    const options = editOptions.map((opt) => opt.trim()).filter(Boolean);
    if (!editText.trim() || options.length < 2) {
      setMessage("Provide question text and at least 2 options.");
      return;
    }
    const correctIndex = Math.max(0, ["A", "B", "C", "D"].indexOf(editCorrect));
    const res = await fetch(`/api/quizzes/${params.quizId}/questions/${questionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: editText, options, correctIndex })
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setMessage(data?.error || "Failed to update question.");
      return;
    }
    setEditingId(null);
    await loadQuestions();
  }

  async function deleteQuestion(questionId: string) {
    if (!confirm("Delete this question?")) {
      return;
    }
    await fetch(`/api/quizzes/${params.quizId}/questions/${questionId}`, { method: "DELETE" });
    await loadQuestions();
  }

  async function deleteAll() {
    if (!confirm("Delete all questions in this quiz?")) {
      return;
    }
    await fetch(`/api/quizzes/${params.quizId}/questions`, { method: "DELETE" });
    await loadQuestions();
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
    if (!filter.trim()) return questions;
    return questions.filter((question) => question.text.toLowerCase().includes(filter.toLowerCase()));
  }, [filter, questions]);

  return (
    <main>
      <div className="page-actions">
        <a className="button-secondary" href="/dashboard">Back to Dashboard</a>
        <LogoutButton />
      </div>
      <h1>Upload Questions</h1>
      <div className="card">
        <input type="file" accept=".csv" onChange={(e) => handleFile(e.target.files?.[0] || null)} />
        <br />
        <br />
        <div className="format-hint">
          Accepted format: CSV with headers `Question`, `OptionA`, `OptionB`, `OptionC`, `OptionD`, `CorrectLetter`.
          Use double quotes if a question contains commas.
          <div className="format-code">
            Question,OptionA,OptionB,OptionC,OptionD,CorrectLetter{"\n"}"Which statement best describes the role of the ALU in a CPU?",It controls program flow,It performs arithmetic and logic operations,It stores long-term data,It manages network I/O,B
          </div>
        </div>
        <br />
        <textarea className="input" rows={10} value={csv} onChange={(e) => setCsv(e.target.value)} />
        <br />
        <br />
        <div className="button-row">
          <button className="button" onClick={upload} disabled={uploading}>
            {uploading ? "Uploading..." : "Upload"}
          </button>
          {uploading ? (
            <span className="spinner-inline">
              <span className="spinner" />
              <span className="section-title">Processing CSV</span>
            </span>
          ) : null}
        </div>
        {message ? <p>{message}</p> : null}
      </div>
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <h2 style={{ margin: 0 }}>Current Questions</h2>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input
              className="input"
              placeholder="Search by question text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ width: 320, flex: "0 1 320px" }}
            />
            <button className="button-secondary" onClick={deleteAll}>Delete All</button>
          </div>
        </div>
        {filtered.length === 0 ? (
          <p>No questions uploaded yet.</p>
        ) : (
          <div className="table">
            <table>
              <thead>
                <tr>
                  <th>Question</th>
                  <th>Options</th>
                  <th>Correct</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((question) => (
                  <tr key={question._id}>
                    <td>
                      {editingId === question._id ? (
                        <textarea
                          className="input"
                          rows={3}
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                        />
                      ) : (
                        question.text
                      )}
                    </td>
                    <td>
                      {editingId === question._id ? (
                        <div style={{ display: "grid", gap: 6 }}>
                          {["A", "B", "C", "D"].map((label, idx) => (
                            <input
                              key={label}
                              className="input"
                              placeholder={`Option ${label}`}
                              value={editOptions[idx] || ""}
                              onChange={(e) => {
                                const next = [...editOptions];
                                next[idx] = e.target.value;
                                setEditOptions(next);
                              }}
                            />
                          ))}
                        </div>
                      ) : (
                        question.options.join(", ")
                      )}
                    </td>
                    <td>
                      {editingId === question._id ? (
                        <select className="input" value={editCorrect} onChange={(e) => setEditCorrect(e.target.value)}>
                          {["A", "B", "C", "D"].map((label) => (
                            <option key={label} value={label}>{label}</option>
                          ))}
                        </select>
                      ) : (
                        ["A", "B", "C", "D"][question.correctIndex || 0]
                      )}
                    </td>
                    <td>
                      {editingId === question._id ? (
                        <div className="table-actions">
                          <button className="button" onClick={() => saveQuestion(question._id)}>Save</button>
                          <button className="button-secondary" onClick={() => setEditingId(null)}>Cancel</button>
                        </div>
                      ) : (
                        <div className="table-actions inline">
                          <button
                            className="button-secondary"
                            onClick={() => {
                              setEditingId(question._id);
                              setEditText(question.text);
                              setEditOptions([
                                question.options[0] || "",
                                question.options[1] || "",
                                question.options[2] || "",
                                question.options[3] || ""
                              ]);
                              const correctLetter = ["A", "B", "C", "D"][question.correctIndex || 0];
                              setEditCorrect(correctLetter);
                            }}
                          >
                            Edit
                          </button>
                          <button className="button-secondary" onClick={() => deleteQuestion(question._id)}>
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
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
