"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError("");
    setLoading(true);
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false
    });

    setLoading(false);
    if (result?.error) {
      setError("Invalid credentials");
      return;
    }

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
