"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "../../lib/api";

export default function SecondCamClient() {
  const params = useSearchParams();
  const attemptId = params.get("attemptId") || "";
  const token = params.get("token") || "";
  const [status, setStatus] = useState("Connecting...");
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const [ended, setEnded] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const snapshotTimerRef = useRef<number | null>(null);
  const statusTimerRef = useRef<number | null>(null);

  function stopCamera() {
    if (snapshotTimerRef.current) {
      window.clearInterval(snapshotTimerRef.current);
      snapshotTimerRef.current = null;
    }
    if (statusTimerRef.current) {
      window.clearInterval(statusTimerRef.current);
      statusTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.srcObject = null;
    }
  }

  async function connectSecondCam() {
    if (!attemptId || !token) {
      setError("Missing attempt details.");
      setStatus("Invalid link");
      return false;
    }
    const res = await apiFetch(`/api/attempts/${attemptId}/second-cam/connect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error || "Unable to connect.");
      setStatus("Connection failed");
      return false;
    }
    setConnected(true);
    setStatus("Connected");
    return true;
  }

  async function captureSnapshot() {
    const video = videoRef.current;
    if (!video || !attemptId || !token) return;
    const width = video.videoWidth || 0;
    const height = video.videoHeight || 0;
    if (!width || !height) return;
    const targetWidth = 320;
    const scale = targetWidth / width;
    const targetHeight = Math.max(1, Math.round(height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
    const base64 = dataUrl.split(",")[1] || "";
    if (!base64) return;
    await apiFetch(`/api/attempts/${attemptId}/second-cam/snapshots`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        data: base64,
        mime: "image/jpeg",
        width: canvas.width,
        height: canvas.height
      })
    }).catch(() => {});
  }

  useEffect(() => {
    let active = true;
    const run = async () => {
      setError("");
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Camera not supported in this browser.");
        setStatus("Camera unavailable");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false
        });
        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => {});
        }
        const ok = await connectSecondCam();
        if (!ok) return;
        snapshotTimerRef.current = window.setInterval(captureSnapshot, 15000);
        statusTimerRef.current = window.setInterval(async () => {
          const res = await apiFetch(`/api/attempts/${attemptId}/status`).catch(() => null);
          const data = await res?.json().catch(() => null);
          if (data?.status && data.status !== "in_progress") {
            setEnded(true);
            setStatus("Exam ended");
            stopCamera();
          }
        }, 5000);
      } catch {
        setError("Unable to access camera.");
        setStatus("Camera blocked");
      }
    };
    run();
    return () => {
      active = false;
      stopCamera();
    };
  }, [attemptId, token]);

  return (
    <main>
      <div className="header-card">
        <h1 className="header-title">Second Camera</h1>
        <p className="header-subtitle">Keep this page open during the exam.</p>
      </div>
      <div className="card">
        <p>Status: {status}</p>
        {error ? <p className="section-title">{error}</p> : null}
        {ended ? <p className="section-title">You may close this page.</p> : null}
        {connected ? (
          <video ref={videoRef} style={{ width: "100%", borderRadius: 12 }} muted playsInline />
        ) : (
          <video ref={videoRef} style={{ display: "none" }} muted playsInline />
        )}
      </div>
    </main>
  );
}
