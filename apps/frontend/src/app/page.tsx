"use client";

import { useEffect } from "react";
import { getAuthToken } from "../lib/api";

export default function HomePage() {
  useEffect(() => {
    if (getAuthToken()) {
      window.location.href = "/dashboard";
    }
  }, []);

  return (
    <main>
      <div className="header">
        <h1>Quiz Platform</h1>
        <p>Instructor and student entry points.</p>
      </div>
      <div className="card">
        <p>Instructor</p>
        <a className="button" href="/login">Log in</a>
      </div>
      <div className="card">
        <p>Student</p>
        <p>Open your quiz link from the invitation email.</p>
      </div>
    </main>
  );
}
