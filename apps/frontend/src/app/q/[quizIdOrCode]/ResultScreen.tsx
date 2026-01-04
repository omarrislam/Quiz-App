import React from "react";

type Props = {
  name: string;
  result: { correctCount: number; totalQuestions: number };
  showScore: boolean;
  title: string;
};

export default function ResultScreen({ name, result, showScore, title }: Props) {
  return (
    <main>
      <div className="header-card">
        <h1 className="header-title">{title}</h1>
        <p className="header-subtitle">Good Luck - fullscreen is required on desktop</p>
      </div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Quiz finished</h2>
        <p>Thank you, {name}.</p>
        {showScore ? (
          <p>Score: {result.correctCount} / {result.totalQuestions}</p>
        ) : (
          <p>Your answers were recorded. You may now close this window.</p>
        )}
      </div>
    </main>
  );
}
