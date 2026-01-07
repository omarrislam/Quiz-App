"use client";

import { useEffect, useRef, useState } from "react";
import LogoutButton from "../../../../../components/LogoutButton";
import { apiFetch } from "../../../../../../lib/api";

type Answer = {
  question: string;
  options: string[];
  selectedIndex: number | null;
  correctIndex: number | null;
};

type AttemptDetail = {
  studentName: string;
  studentEmail: string;
  status: string;
  score?: { correctCount: number; totalQuestions: number };
  answers: Answer[];
  snapshots?: { phase: string; mime: string; data: string; createdAt?: string }[];
  secondCamSnapshots?: { mime: string; data: string; createdAt?: string }[];
};

export default function AttemptDetailPage({ params }: { params: { quizId: string; attemptId: string } }) {
  const [detail, setDetail] = useState<AttemptDetail | null>(null);
  const [downloading, setDownloading] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    apiFetch(`/api/attempts/${params.attemptId}/detail`)
      .then((res) => res.json())
      .then((data) => setDetail(data))
      .catch(() => setDetail(null));
  }, [params.attemptId]);

  async function downloadPdf() {
    if (!detail || !contentRef.current || downloading) return;
    setDownloading(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf")
      ]);
      const canvas = await html2canvas(contentRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "pt", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const safeName = (detail.studentName || "student")
        .trim()
        .replace(/[^a-zA-Z0-9 _-]/g, "")
        .replace(/\s+/g, "_");
      pdf.save(`${safeName}_attempt.pdf`);
    } finally {
      setDownloading(false);
    }
  }

  if (!detail) {
    return (
      <main>
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main>
      <div className="page-actions">
        <a className="button-secondary" href="/dashboard">Back to Dashboard</a>
        <a className="button-secondary" href={`/dashboard/quizzes/${params.quizId}/monitor`}>Back to Monitor</a>
        <button className="button-secondary" type="button" onClick={downloadPdf} disabled={downloading}>
          {downloading ? (
            <span className="spinner-inline">
              <span className="spinner" />
              Preparing PDF...
            </span>
          ) : (
            "Download PDF"
          )}
        </button>
      </div>
      <div ref={contentRef}>
        <div className="header-card">
          <div className="header-card-row">
            <div>
              <h1 className="header-title">Attempt Detail</h1>
              <p className="header-subtitle">Responses by student.</p>
            </div>
            <div className="header-card-actions">
              <LogoutButton />
            </div>
          </div>
        </div>
        <div className="card">
          <p>Name: {detail.studentName}</p>
          <p>Email: {detail.studentEmail}</p>
          <p>Status: {detail.status}</p>
          <p>Score: {detail.score ? `${detail.score.correctCount}/${detail.score.totalQuestions}` : "-"}</p>
        </div>
        <div className="card">
          <h2>Webcam Snapshots</h2>
          {detail.snapshots && detail.snapshots.length > 0 ? (
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
              {detail.snapshots.map((snapshot, idx) => (
                <div key={`${snapshot.phase}-${idx}`}>
                  <p className="section-title" style={{ margin: "0 0 6px" }}>
                    {snapshot.phase === "start" ? "Start" : snapshot.phase === "middle" ? "Middle" : "End"}
                  </p>
                  <img
                    src={`data:${snapshot.mime};base64,${snapshot.data}`}
                    alt={`${snapshot.phase} snapshot`}
                    style={{ width: "100%", borderRadius: 10, border: "1px solid #eef1f7" }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p>No snapshots recorded.</p>
          )}
        </div>
        <div className="card">
          <h2>Second Camera Snapshots</h2>
          {detail.secondCamSnapshots && detail.secondCamSnapshots.length > 0 ? (
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
              {detail.secondCamSnapshots.map((snapshot, idx) => (
                <div key={`second-cam-${idx}`}>
                  <p className="section-title" style={{ margin: "0 0 6px" }}>
                    {snapshot.createdAt ? new Date(snapshot.createdAt).toLocaleTimeString() : "Snapshot"}
                  </p>
                  <img
                    src={`data:${snapshot.mime};base64,${snapshot.data}`}
                    alt="Second camera snapshot"
                    style={{ width: "100%", borderRadius: 10, border: "1px solid #eef1f7" }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p>No second camera snapshots recorded.</p>
          )}
        </div>
        <div className="card">
          <h2>Responses</h2>
          {detail.answers.length === 0 ? (
            <p>No answers recorded.</p>
          ) : (
            <ol>
              {detail.answers.map((answer, idx) => (
                <li key={idx} style={{ marginBottom: 12 }}>
                  <strong>{answer.question}</strong>
                  <ul>
                    {answer.options.map((opt, optionIndex) => {
                      const selected = optionIndex === answer.selectedIndex;
                      const correct = optionIndex === answer.correctIndex;
                      return (
                        <li key={opt} className={selected ? "selected-answer" : ""}>
                          {opt}{selected ? " (selected)" : ""}{correct ? " (correct)" : ""}
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </main>
  );
}
