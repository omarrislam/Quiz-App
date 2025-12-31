import { Attempt } from "../models/Attempt";

export async function exportAttemptsCsv(quizId: string) {
  const attempts = await Attempt.find({ quizId }).lean();
  const header = "studentName,studentEmail,status,correctCount,totalQuestions,submittedAt";
  const rows = attempts.map((a) => {
    const correct = a.score?.correctCount ?? 0;
    const total = a.score?.totalQuestions ?? 0;
    const submitted = a.submittedAt ? new Date(a.submittedAt).toISOString() : "";
    return `${a.studentName},${a.studentEmail},${a.status},${correct},${total},${submitted}`;
  });
  return [header, ...rows].join("\n");
}
