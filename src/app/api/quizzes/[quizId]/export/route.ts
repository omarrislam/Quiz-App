import { connectDb } from "../../../../../server/db";
import { requireInstructor } from "../../../../../server/auth/requireInstructor";
import { assertQuizOwnership } from "../../../../../server/quizzes/quizService";
import { exportAttemptsCsv } from "../../../../../server/quizzes/exportService";

export async function GET(_: Request, { params }: { params: { quizId: string } }) {
  const session = await requireInstructor();
  await connectDb();
  await assertQuizOwnership(session.user.id, params.quizId);
  const csv = await exportAttemptsCsv(params.quizId);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename=\"quiz-${params.quizId}-attempts.csv\"`
    }
  });
}
