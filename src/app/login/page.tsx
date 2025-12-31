"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false
    });

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
        <button className="button" onClick={submit}>Login</button>
        {error ? <p>{error}</p> : null}
        <p>
          New instructor? <a href="/register">Create an account</a>
        </p>
      </div>
    </main>
  );
}
