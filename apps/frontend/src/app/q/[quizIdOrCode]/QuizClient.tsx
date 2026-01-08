"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "../../../lib/api";

type Question = { id: string; text: string; options: string[] };

type ResultPayload = { correctCount: number; totalQuestions: number };

type Props = {
  attemptId: string;
  title: string;
  questions: Question[];
  questionTimeSeconds: number;
  totalTimeSeconds: number | null;
  requireFullscreen: boolean;
  logSuspiciousActivity: boolean;
  enableWebcamSnapshots: boolean;
  enableFaceCentering: boolean;
  enableSecondCam: boolean;
  onFinish: (result: ResultPayload) => void;
};

const badges = ["A", "B", "C", "D", "E", "F"];

export default function QuizClient({
  attemptId,
  title,
  questions,
  questionTimeSeconds,
  totalTimeSeconds,
  requireFullscreen,
  logSuspiciousActivity,
  enableWebcamSnapshots,
  enableFaceCentering,
  enableSecondCam,
  onFinish
}: Props) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const answersRef = useRef<Record<string, number | null>>({});
  const [remaining, setRemaining] = useState(questionTimeSeconds);
  const [examRemaining, setExamRemaining] = useState(totalTimeSeconds || 0);
  const [paused, setPaused] = useState(false);
  const [overlay, setOverlay] = useState(false);
  const [overlaySeconds, setOverlaySeconds] = useState(10);
  const [ready, setReady] = useState(false);
  const [forceEnded, setForceEnded] = useState(false);
  const submittingRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const capturedRef = useRef({ start: false, middle: false, end: false });
  const abandonRef = useRef(false);
  const [webcamActive, setWebcamActive] = useState(false);
  const [webcamReady, setWebcamReady] = useState(false);
  const [webcamError, setWebcamError] = useState("");
  const [webcamStarting, setWebcamStarting] = useState(false);
  const [webcamPermission, setWebcamPermission] = useState<"granted" | "denied" | "prompt" | "unknown">("unknown");
  const [faceStatus, setFaceStatus] = useState<"ok" | "off_center" | "missing">("missing");
  const faceCheckRef = useRef(false);
  const faceDetectorRef = useRef<any>(null);
  const faceStatusRef = useRef<"ok" | "off_center" | "missing">("missing");
  const [faceWarningSeconds, setFaceWarningSeconds] = useState(0);

  const autoSubmitThresholdSeconds = 15;
  const webcamRequired = enableWebcamSnapshots || enableFaceCentering;
  const snapshotsEnabled = enableWebcamSnapshots || enableFaceCentering;

  const isDesktop = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(pointer:fine)").matches && window.innerWidth >= 768;
  }, []);

  useEffect(() => {
    setRemaining(questionTimeSeconds);
  }, [index, questionTimeSeconds]);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    if (!totalTimeSeconds) return;
    setExamRemaining(totalTimeSeconds);
  }, [totalTimeSeconds]);

  async function logEvent(type: string, message?: string) {
    if (!logSuspiciousActivity) return;
    await apiFetch(`/api/attempts/${attemptId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, message })
    });
  }

  function buildAnswersPayload() {
    return {
      answers: questions.map((q) => {
        const selectedIndex = answersRef.current[q.id] ?? null;
        return {
          questionId: q.id,
          selectedIndex,
          selectedOption: selectedIndex == null ? null : q.options[selectedIndex] ?? null
        };
      })
    };
  }

  function resolveApiUrl(path: string) {
    const base = typeof process !== "undefined" ? (process.env.NEXT_PUBLIC_API_BASE_URL || "") : "";
    if (!base) return path;
    return `${base.replace(/\/$/, "")}${path.startsWith("/") ? "" : "/"}${path}`;
  }

  function submitAttemptOnExit(reason: string) {
    if (abandonRef.current) return;
    abandonRef.current = true;
    setForceEnded(true);
    setPaused(true);
    stopWebcam();
    const payload = JSON.stringify({ ...buildAnswersPayload(), reason });
    if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      const blob = new Blob([payload], { type: "application/json" });
      const finishUrl = resolveApiUrl(`/api/attempts/${attemptId}/finish`);
      const sent = navigator.sendBeacon(finishUrl, blob);
      if (!sent) {
        navigator.sendBeacon(resolveApiUrl(`/api/attempts/${attemptId}/abandon`), blob);
      }
      return;
    }
    apiFetch(`/api/attempts/${attemptId}/finish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload
    }).catch(() => {});
  }

  function stopWebcam() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    const globalStream = typeof window !== "undefined" ? (window as any).__qp_webcam_stream : null;
    if (globalStream) {
      globalStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      (window as any).__qp_webcam_stream = null;
    }
    const video = videoRef.current;
    if (video) {
      video.pause();
      (video as HTMLVideoElement).srcObject = null;
    }
    setWebcamActive(false);
    setWebcamReady(false);
    setFaceStatus("missing");
    faceStatusRef.current = "missing";
    setFaceWarningSeconds(0);
  }

  async function ensureVideoReady(retries = 6, delayMs = 200) {
    const video = videoRef.current;
    if (!video) return false;
    for (let attempt = 0; attempt < retries; attempt += 1) {
      if (video.readyState >= 2) {
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    return false;
  }

  async function startWebcam() {
    if (webcamStarting || webcamActive) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setWebcamError("Camera not supported in this browser.");
      return;
    }
    setWebcamError("");
    setWebcamStarting(true);
    setWebcamReady(false);
    try {
      const existing = typeof window !== "undefined"
        ? (window as any).__qp_webcam_stream as MediaStream | null
        : null;
      const hasLiveTrack = existing?.getVideoTracks().some((track) => track.readyState === "live");
      if (existing && hasLiveTrack) {
        streamRef.current = existing;
        setWebcamActive(true);
        const video = videoRef.current;
        if (video) {
          video.srcObject = existing;
          video.onloadedmetadata = () => setWebcamReady(true);
          video.onloadeddata = () => setWebcamReady(true);
          await video.play().catch(() => {});
        }
        setWebcamStarting(false);
        return;
      }
      if (existing) {
        existing.getTracks().forEach((track) => track.stop());
        if (typeof window !== "undefined") {
          (window as any).__qp_webcam_stream = null;
        }
      }
      if (webcamPermission === "denied") {
        setWebcamError("Camera blocked. Allow permissions in your browser to continue.");
        setWebcamStarting(false);
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 320 }, height: { ideal: 240 } },
        audio: false
      });
      streamRef.current = stream;
      if (typeof window !== "undefined") {
        (window as any).__qp_webcam_stream = stream;
      }
      setWebcamActive(true);
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        video.onloadedmetadata = () => setWebcamReady(true);
        video.onloadeddata = () => setWebcamReady(true);
        await video.play().catch(() => {});
      }
      window.setTimeout(() => {
        if (streamRef.current && !webcamReady) {
          setWebcamReady(true);
        }
      }, 800);
      const [track] = stream.getVideoTracks();
      if (track) {
        track.addEventListener("ended", () => {
          stopWebcam();
          setWebcamError("Camera disconnected. Please allow permissions to reconnect.");
        });
      }
      setWebcamStarting(false);
      sessionStorage.setItem("qp_webcam_granted", "true");
    } catch (error) {
      const message = error instanceof Error ? error.name : "Camera access blocked.";
      if (message === "NotAllowedError") {
        setWebcamError("Camera access blocked. Please allow camera permission and reload.");
      } else if (message === "NotFoundError") {
        setWebcamError("No camera found on this device.");
      } else {
        setWebcamError("Unable to access camera.");
      }
      setWebcamActive(false);
      setWebcamStarting(false);
      sessionStorage.setItem("qp_webcam_granted", "false");
    }
  }

  async function captureSnapshot(phase: "start" | "middle" | "end") {
    if (!snapshotsEnabled || !webcamActive) return;
    if (capturedRef.current[phase]) return;
    const video = videoRef.current;
    if (!video) return;
    const ready = await ensureVideoReady();
    if (!ready) return;
    const sourceWidth = video.videoWidth || 0;
    const sourceHeight = video.videoHeight || 0;
    if (!sourceWidth || !sourceHeight) return;
    const targetWidth = 320;
    const scale = targetWidth / sourceWidth;
    const targetHeight = Math.max(1, Math.round(sourceHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
    const base64 = dataUrl.split(",")[1] || "";
    if (!base64) return;
    capturedRef.current[phase] = true;
    try {
      const res = await apiFetch(`/api/attempts/${attemptId}/snapshots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase,
          data: base64,
          mime: "image/jpeg",
          width: canvas.width,
          height: canvas.height
        })
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.warn("snapshot_failed", { phase, status: res.status, body: text });
        capturedRef.current[phase] = false;
      }
    } catch {
      console.warn("snapshot_failed", { phase, status: "network_error" });
      capturedRef.current[phase] = false;
    }
  }

  function isFullscreenActive() {
    return Boolean(document.fullscreenElement);
  }

  async function requestFullscreen() {
    if (!document.documentElement.requestFullscreen) return;
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (!requireFullscreen || !isDesktop) return;

    const onFullscreenChange = () => {
      const active = isFullscreenActive();
      if (!active) {
        setOverlay(true);
        setPaused(true);
        setOverlaySeconds(10);
        logEvent("fullscreen_exit", "Fullscreen exited");
      } else {
        setOverlay(false);
        setPaused(false);
      }
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    requestFullscreen();

    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, [requireFullscreen, isDesktop]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!webcamRequired) {
      stopWebcam();
      return;
    }
    let active = true;
    const run = async () => {
      await startWebcam();
      if (!active) {
        stopWebcam();
      }
    };
    run();
    return () => {
      active = false;
      stopWebcam();
    };
  }, [webcamRequired]);

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    if (!(navigator as any).permissions?.query) return;
    let active = true;
    (navigator as any).permissions
      .query({ name: "camera" })
      .then((status: any) => {
        if (!active) return;
        setWebcamPermission(status.state || "unknown");
        status.onchange = () => {
          setWebcamPermission(status.state || "unknown");
        };
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    faceStatusRef.current = faceStatus;
    if (faceStatus === "ok") {
      setFaceWarningSeconds(0);
    }
  }, [faceStatus]);

  useEffect(() => {
    if (!enableFaceCentering || !webcamActive || !webcamReady) {
      setFaceStatus("missing");
      return;
    }
    let cancelled = false;
    let intervalId: number | null = null;
    const setup = async () => {
      const { FaceDetection } = await import("@mediapipe/face_detection");
      if (cancelled) return;
      const detector = new FaceDetection({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`
      });
      detector.setOptions({ model: "short", minDetectionConfidence: 0.5 });
      detector.onResults((results: any) => {
        if (cancelled) return;
        const detections = results?.detections || [];
        if (!detections.length) {
          setFaceStatus("missing");
          return;
        }
        const box = detections[0]?.boundingBox || {};
        let xCenter = typeof box.xCenter === "number" ? box.xCenter : null;
        let yCenter = typeof box.yCenter === "number" ? box.yCenter : null;
        if (xCenter == null || yCenter == null) {
          const xMin = typeof box.xMin === "number" ? box.xMin : null;
          const yMin = typeof box.yMin === "number" ? box.yMin : null;
          const width = typeof box.width === "number" ? box.width : null;
          const height = typeof box.height === "number" ? box.height : null;
          if (xMin != null && yMin != null && width != null && height != null) {
            xCenter = xMin + width / 2;
            yCenter = yMin + height / 2;
          }
        }
        if (xCenter == null || yCenter == null) {
          setFaceStatus("missing");
          return;
        }
        const video = videoRef.current;
        if (!video || !video.videoWidth || !video.videoHeight) {
          setFaceStatus("missing");
          return;
        }
        const normalizedX = xCenter > 1 ? xCenter / video.videoWidth : xCenter;
        const normalizedY = yCenter > 1 ? yCenter / video.videoHeight : yCenter;
        const threshold = 0.25;
        const offCenter =
          Math.abs(normalizedX - 0.5) > threshold || Math.abs(normalizedY - 0.5) > threshold;
        setFaceStatus(offCenter ? "off_center" : "ok");
      });
      faceDetectorRef.current = detector;
      intervalId = window.setInterval(async () => {
        const video = videoRef.current;
        if (!video || faceCheckRef.current) return;
        faceCheckRef.current = true;
        try {
          await detector.send({ image: video });
        } catch {
          setFaceStatus("missing");
        } finally {
          faceCheckRef.current = false;
        }
      }, 500);
    };
    setup();

    return () => {
      cancelled = true;
      if (intervalId) {
        window.clearInterval(intervalId);
      }
      if (faceDetectorRef.current?.close) {
        faceDetectorRef.current.close();
      }
      faceDetectorRef.current = null;
    };
  }, [enableFaceCentering, webcamActive, webcamReady]);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      setReady(true);
    });
    return () => window.cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!snapshotsEnabled || !webcamActive || !webcamReady || !ready) return;
    const startId = window.setTimeout(() => {
      captureSnapshot("start");
    }, 1500);
    return () => {
      window.clearTimeout(startId);
    };
  }, [snapshotsEnabled, webcamActive, webcamReady, ready]);

  useEffect(() => {
    if (!snapshotsEnabled || !webcamActive || !webcamReady) return;
    const midpoint = Math.max(0, Math.floor(questions.length / 2));
    if (index >= midpoint && !capturedRef.current.middle) {
      captureSnapshot("middle");
    }
  }, [snapshotsEnabled, webcamActive, webcamReady, index, questions.length]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        logEvent("visibility_hidden", "Tab hidden");
        submitAttemptOnExit("visibility_hidden");
      } else {
        logEvent("visibility_visible", "Tab visible");
      }
    };
    const onBlur = () => logEvent("window_blur", "Window blurred");
    const onFocus = () => logEvent("window_focus", "Window focused");
    const onPageHide = () => submitAttemptOnExit("page_hide");

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, []);

  useEffect(() => {
    const onContextMenu = (event: MouseEvent) => {
      event.preventDefault();
      logEvent("context_menu", "Right click blocked");
    };
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const isCopy = (event.ctrlKey || event.metaKey) && ["c", "v", "x"].includes(key);
      if (isCopy) {
        event.preventDefault();
        logEvent(key === "c" ? "copy" : key === "v" ? "paste" : "cut", "Clipboard blocked");
      }
      if (event.key === "F12") {
        logEvent("devtools_attempt", "F12 pressed");
      }
    };
    const onClipboard = (event: ClipboardEvent) => {
      event.preventDefault();
      logEvent(event.type, "Clipboard blocked");
    };

    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("copy", onClipboard);
    document.addEventListener("paste", onClipboard);
    document.addEventListener("cut", onClipboard);

    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("copy", onClipboard);
      document.removeEventListener("paste", onClipboard);
      document.removeEventListener("cut", onClipboard);
    };
  }, [logSuspiciousActivity, attemptId]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (paused || !ready) return;
      setRemaining((prev) => Math.max(0, prev - 1));
      if (totalTimeSeconds) {
        setExamRemaining((prev) => Math.max(0, prev - 1));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [paused, totalTimeSeconds, ready]);

  useEffect(() => {
    if (!enableFaceCentering) return;
    const timer = setInterval(() => {
      if (faceStatusRef.current === "ok") {
        return;
      }
      setFaceWarningSeconds((prev) => {
        const next = prev + 1;
        if (next >= autoSubmitThresholdSeconds) {
          submitNow();
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [enableFaceCentering]);

  useEffect(() => {
    const poll = setInterval(() => {
      apiFetch(`/api/attempts/${attemptId}/status`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.status && data.status !== "in_progress") {
            setForceEnded(true);
            setPaused(true);
          }
        })
        .catch(() => {});
    }, 4000);
    return () => clearInterval(poll);
  }, [attemptId]);

  useEffect(() => {
    if (!ready) return;
    if (remaining <= 0) {
      goNext(true);
    }
  }, [remaining, ready]);

  useEffect(() => {
    if (!totalTimeSeconds) return;
    if (!ready) return;
    if (examRemaining <= 0) {
      submitNow();
    }
  }, [examRemaining, totalTimeSeconds, ready]);

  useEffect(() => {
    if (forceEnded) {
      stopWebcam();
    }
  }, [forceEnded]);

  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, []);

  useEffect(() => {
    if (!overlay) return;
    const timer = setInterval(() => {
      setOverlaySeconds((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [overlay]);

  useEffect(() => {
    if (!overlay) return;
    if (overlaySeconds <= 0) {
      submitNow();
    }
  }, [overlaySeconds, overlay]);

  const current = questions[index];
  const total = questions.length;
  const progress = useMemo(() => {
    if (total === 0) return 0;
    return Math.round((index / total) * 100);
  }, [index, total]);

  function choose(optionIndex: number) {
    answersRef.current = { ...answersRef.current, [current.id]: optionIndex };
    setAnswers((prev) => ({ ...prev, [current.id]: optionIndex }));
  }

  async function submitNow() {
    if (submittingRef.current) return;
    submittingRef.current = true;
    await captureSnapshot("end");
    const payload = buildAnswersPayload();
    try {
      const res = await apiFetch(`/api/attempts/${attemptId}/finish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await res.json().catch(() => null);
      if (!res.ok) {
        console.warn("finish_failed", { status: res.status, body: result });
        setForceEnded(true);
        return;
      }
      onFinish(result);
    } finally {
      stopWebcam();
    }
  }

  async function goNext(force = false) {
    if (!force && answers[current.id] == null) {
      return;
    }
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      return;
    }
    await submitNow();
  }

  if (!current) {
    return (
      <main>
        <div className="header-card">
          <h1 className="header-title">{title}</h1>
          <p className="header-subtitle">Good Luck - fullscreen is required on desktop</p>
        </div>
        <div className="card">
          <p>No questions available for this quiz.</p>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="header-card">
        <h1 className="header-title">{title}</h1>
        <p className="header-subtitle">Good Luck - fullscreen is required on desktop</p>
      </div>
      {webcamRequired ? (
        <div className="card">
          <p className="section-title" style={{ marginBottom: 6 }}>
            {enableFaceCentering
              ? "Webcam monitoring enabled"
              : "Webcam snapshots enabled"}
          </p>
          {webcamActive ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              {enableFaceCentering ? (
                <span
                  style={{
                    padding: "4px 10px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 600,
                    background: faceStatus === "ok" ? "#dcfce7" : faceStatus === "off_center" ? "#fef3c7" : "#fee2e2",
                    color: faceStatus === "ok" ? "#166534" : faceStatus === "off_center" ? "#92400e" : "#991b1b"
                  }}
                >
                  {faceStatus === "ok" ? "Face centered" : faceStatus === "off_center" ? "Face off-center" : "Face not detected"}
                </span>
              ) : null}
              <p style={{ margin: 0 }}>
                {enableFaceCentering
                  ? faceStatus === "ok"
                    ? "Camera connected. Snapshots will be captured automatically."
                    : `Please center your face. Auto-submit in ${Math.max(0, autoSubmitThresholdSeconds - faceWarningSeconds)}s.`
                  : "Camera connected. Snapshots will be captured automatically."}
              </p>
            </div>
          ) : (
            <>
              <p>
                {webcamStarting
                  ? "Connecting to camera..."
                  : webcamError ||
                    (webcamPermission === "denied"
                      ? "Camera blocked. Allow permissions in your browser to continue."
                      : "Camera access is required. Please allow webcam permissions in your browser.")}
              </p>
              <button className="button-secondary" type="button" onClick={startWebcam} disabled={webcamStarting}>
                {webcamStarting ? "Connecting..." : "Retry camera"}
              </button>
            </>
          )}
        </div>
      ) : null}
      <div className="card">
        <div className="meta-row">
          <span>Question {index + 1} / {total}</span>
          <span className="timer">{remaining}s</span>
        </div>
        <h2 style={{ margin: "6px 0 4px" }}>Question text</h2>
        <div className="progress">
          <div className="progress-bar" style={{ width: `${progress}%` }} />
        </div>
        <p style={{ marginTop: 0 }}>{current.text}</p>
        {current.options.map((opt, idx) => (
          <div
            key={`${current.id}-${idx}`}
            className={`option ${answers[current.id] === idx ? "selected" : ""}`}
            onClick={() => choose(idx)}
            role="button"
            tabIndex={0}
          >
            <span className="option-badge">{badges[idx] || ""}</span>
            <span>{opt}</span>
          </div>
        ))}
        <div className="button-row">
          <button className="button" onClick={() => goNext(false)} disabled={answers[current.id] == null}>
            {index + 1 === total ? "Finish" : "Next"}
          </button>
          <button className="button-secondary" onClick={submitNow}>Quit</button>
          <span className="section-title" style={{ marginLeft: "auto" }}>Progress: {index} / {total}</span>
        </div>
        {totalTimeSeconds ? (
          <p className="section-title" style={{ marginTop: 10 }}>Total time left: {examRemaining}s</p>
        ) : null}
      </div>
      {forceEnded ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(12, 20, 41, 0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 60
          }}
        >
          <div className="card" style={{ maxWidth: 420, textAlign: "center" }}>
            <h2 style={{ marginTop: 0 }}>Exam ended</h2>
            <p>The instructor ended this attempt. You may close this window.</p>
          </div>
        </div>
      ) : null}
      {overlay ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(12, 20, 41, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50
          }}
        >
          <div className="card" style={{ maxWidth: 420, textAlign: "center" }}>
            <h2 style={{ marginTop: 0 }}>You left fullscreen</h2>
            <p>Detected: fullscreen_exit - you must enter fullscreen to continue.</p>
            <div className="button-row" style={{ justifyContent: "center" }}>
              <button className="button" onClick={requestFullscreen}>Return to Fullscreen</button>
              <button className="button-secondary" onClick={submitNow}>I can't - contact instructor ({overlaySeconds}s)</button>
            </div>
          </div>
        </div>
      ) : null}
      <video ref={videoRef} style={{ display: "none" }} muted playsInline aria-hidden="true" />
    </main>
  );
}
