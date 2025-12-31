"use client";

import { useState } from "react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const domain = "@mans.edu.eg";

  async function submit() {
    setMessage("");
    if (!email.toLowerCase().endsWith(domain)) {
      setMessage(`Email must end with ${domain}`);
      return;
    }
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });

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
        <p className="section-title" style={{ marginTop: 6 }}>Only {domain} emails are allowed.</p>
        <br />
        <br />
        <input className="input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <br />
        <br />
        <button className="button" onClick={submit}>Register</button>
        {message ? <p>{message}</p> : null}
        <p>
          Already have an account? <a href="/login">Log in</a>
        </p>
      </div>
    </main>
  );
}
