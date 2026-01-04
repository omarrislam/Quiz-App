"use client";

import { useEffect, useState } from "react";
import QuizClient from "./QuizClient";
import ResultScreen from "./ResultScreen";
import { apiFetch } from "../../../lib/api";

type QuizPayload = {
  attemptId: string;
  title: string;
  questions: { id: string; text: string; options: string[] }[];
  settings: {
    questionTimeSeconds: number;
    showScoreToStudent: boolean;
    requireFullscreen: boolean;
    logSuspiciousActivity: boolean;
    enableWebcamSnapshots: boolean;
    totalTimeSeconds: number | null;
  };
};

type ResultPayload = { correctCount: number; totalQuestions: number };

type Student = { _id: string; name: string; email: string };

export default function QuizPage({ params }: { params: { quizIdOrCode: string } }) {
  const [quizTitle, setQuizTitle] = useState("Quiz");
  const [questionTimeSeconds, setQuestionTimeSeconds] = useState<number | null>(null);
  const [webcamRequired, setWebcamRequired] = useState<boolean | null>(null);
  const [webcamGranted, setWebcamGranted] = useState(false);
  const [webcamError, setWebcamError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [quiz, setQuiz] = useState<QuizPayload | null>(null);
  const [result, setResult] = useState<ResultPayload | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [suggestions, setSuggestions] = useState<Student[]>([]);
  const [showList, setShowList] = useState(false);

  useEffect(() => {
    const paramsObj = new URLSearchParams(window.location.search);
    const prefillName = paramsObj.get("name");
    const prefillEmail = paramsObj.get("email");
    if (prefillName) {
      setName(prefillName);
    }
    if (prefillEmail) {
      setEmail(prefillEmail);
    }
  }, []);

  useEffect(() => {
    apiFetch(`/api/quizzes/${params.quizIdOrCode}/public`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.title) {
          setQuizTitle(data.title);
        }
        if (typeof data?.questionTimeSeconds === "number") {
          setQuestionTimeSeconds(data.questionTimeSeconds);
        }
        if (typeof data?.enableWebcamSnapshots === "boolean") {
          setWebcamRequired(data.enableWebcamSnapshots);
        }
      })
      .catch(() => {});
  }, [params.quizIdOrCode]);

  async function requestWebcamAccess() {
    setWebcamError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setWebcamError("Camera not supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      stream.getTracks().forEach((track) => track.stop());
      setWebcamGranted(true);
    } catch {
      setWebcamError("Camera access blocked. Please allow permission.");
      setWebcamGranted(false);
    }
  }

  useEffect(() => {
    if (!name.trim()) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    apiFetch(`/api/quizzes/${params.quizIdOrCode}/students/public?q=${encodeURIComponent(name)}`, {
      signal: controller.signal
    })
      .then((res) => res.json())
      .then((data) => setSuggestions(Array.isArray(data) ? data : []))
      .catch(() => setSuggestions([]));
    return () => controller.abort();
  }, [name, params.quizIdOrCode]);

  async function verify() {
    setError("");
    setMessage("");
    const res = await apiFetch(`/api/quizzes/${params.quizIdOrCode}/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp })
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.settings || !data?.questions) {
      setError(data?.error || "OTP verification failed.");
      return;
    }
    setQuiz(data);
  }

  async function resendOtp() {
    setMessage("");
    setError("");
    const res = await apiFetch(`/api/quizzes/${params.quizIdOrCode}/invitations/resend-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.error || "Failed to resend OTP.");
      return;
    }
    setMessage("OTP sent. Check your email or dev console.");
  }

  function pickStudent(student: Student) {
    setName(student.name);
    setEmail(student.email);
    setShowList(false);
  }

  if (result && quiz) {
    return <ResultScreen name={email} result={result} showScore={quiz.settings.showScoreToStudent} title={quiz.title} />;
  }

  if (quiz) {
    return (
      <QuizClient
        attemptId={quiz.attemptId}
        title={quiz.title}
        questions={quiz.questions}
        questionTimeSeconds={quiz.settings.questionTimeSeconds}
        totalTimeSeconds={quiz.settings.totalTimeSeconds}
        requireFullscreen={quiz.settings.requireFullscreen}
        logSuspiciousActivity={quiz.settings.logSuspiciousActivity}
        enableWebcamSnapshots={quiz.settings.enableWebcamSnapshots}
        onFinish={setResult}
      />
    );
  }

  return (
    <main>
      <div className="header-card">
        <h1 className="header-title">{quizTitle}</h1>
        <p className="header-subtitle">Good Luck - fullscreen is required on desktop</p>
      </div>
      <div className="card">
        <p className="section-title">Select your name (Search & select your name)</p>
        <input
          className="input"
          placeholder="Type your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onFocus={() => setShowList(true)}
        />
        {showList && suggestions.length > 0 ? (
          <div className="dropdown">
            {suggestions.map((student) => (
              <div key={student._id} className="dropdown-item" onClick={() => pickStudent(student)}>
                {student.name}
              </div>
            ))}
          </div>
        ) : null}
        <br />
        <br />
        <p className="section-title">Email address</p>
        <input className="input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <br />
        <br />
        <p className="section-title">OTP code</p>
        <input className="input" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />
        <br />
        <br />
        <div className="button-row" style={{ marginTop: -6 }}>
          <button
            className="button-secondary"
            type="button"
            onClick={requestWebcamAccess}
            disabled={webcamRequired === false}
          >
            {webcamGranted ? "Webcam Ready" : webcamRequired === null ? "Checking webcam..." : "Enable Webcam"}
          </button>
          <span className="section-title">
            {webcamRequired === null
              ? "Checking quiz requirements..."
              : webcamRequired
              ? webcamGranted
                ? "Webcam permission granted."
                : "Webcam access required to start."
              : "Webcam not required for this quiz."}
          </span>
          {webcamError ? <span className="section-title">{webcamError}</span> : null}
        </div>
        <br />
        <div className="button-row">
          <button
            className="button"
            onClick={verify}
            disabled={(webcamRequired === null) || (webcamRequired && !webcamGranted)}
          >
            Start Quiz
          </button>
          <button className="button-secondary" type="button" onClick={resendOtp}>Resend OTP</button>
          <button
            className="button-secondary"
            type="button"
            onClick={() => alert("One question per page. You must stay in fullscreen on desktop. Only one submission per student.")}
          >
            How it works
          </button>
          <span className="section-title" style={{ marginLeft: 8 }}>
            Time per question: {questionTimeSeconds ?? 35}s
          </span>
        </div>
        {message ? <p>{message}</p> : null}
        {error ? <p>{error}</p> : null}
      </div>
    </main>
  );
}
