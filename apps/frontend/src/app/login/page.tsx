"use client";

import { useEffect, useState } from "react";
import { apiFetch, getAuthToken, setAuthToken } from "../../lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getAuthToken()) {
      window.location.href = "/dashboard";
    }
  }, []);

  async function submit() {
    setError("");
    setLoading(true);
    const res = await apiFetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error || "Invalid credentials");
      return;
    }

    const data = await res.json().catch(() => null);
    if (!data?.token) {
      setError("Login failed");
      return;
    }

    setAuthToken(data.token);
    window.location.href = "/dashboard";
  }

  return (
    <main>
      <h1>Instructor Login</h1>
      <div className="card">
        <input className="input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <br />
        <br />
        <input className="input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <br />
        <br />
        <div className="button-row">
          <button className="button" onClick={submit} disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
          {loading ? (
            <span className="spinner-inline">
              <span className="spinner" />
              <span className="section-title">Checking credentials</span>
            </span>
          ) : null}
        </div>
        {error ? <p>{error}</p> : null}
        <p>
          New instructor? <a href="/register">Create an account</a>
        </p>
      </div>
    </main>
  );
}
