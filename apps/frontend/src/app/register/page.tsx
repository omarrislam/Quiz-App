"use client";

import { useState } from "react";
import { apiFetch } from "../../lib/api";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setMessage("");
    setLoading(true);
    const res = await apiFetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setMessage(data?.error || "Registration failed");
      return;
    }

    setMessage("Account created. You can log in.");
  }

  return (
    <main>
      <h1>Create Instructor Account</h1>
      <div className="card">
        <input className="input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <br />
        <br />
        <input className="input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <br />
        <br />
        <input className="input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <br />
        <br />
        <button className="button" onClick={submit} disabled={loading}>
          {loading ? "Creating..." : "Register"}
        </button>
        {loading ? (
          <span className="spinner-inline">
            <span className="spinner" />
            <span className="section-title">Creating account</span>
          </span>
        ) : null}
        {message ? <p>{message}</p> : null}
        <p>
          Already have an account? <a href="/login">Log in</a>
        </p>
      </div>
    </main>
  );
}
