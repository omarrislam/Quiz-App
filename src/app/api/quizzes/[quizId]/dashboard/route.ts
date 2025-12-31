import { connectDb } from "../../../../../server/db";
import { ok, handleError } from "../../../../../server/http/response";
import { requireInstructor } from "../../../../../server/auth/requireInstructor";
import { Attempt } from "../../../../../server/models/Attempt";
import { Quiz } from "../../../../../server/models/Quiz";
import { assertQuizOwnership } from "../../../../../server/quizzes/quizService";

export async function GET(_: Request, { params }: { params: { quizId: string } }) {
  try {
    const session = await requireInstructor();
    await connectDb();
    await assertQuizOwnership(session.user.id, params.quizId);
    const attempts = await Attempt.find({ quizId: params.quizId }).lean();
    const quiz = await Quiz.findById(params.quizId).lean();
    const endAt = quiz?.settings?.endAt ? new Date(quiz.settings.endAt) : null;
    const now = new Date();
    const remainingSeconds = endAt ? Math.max(0, Math.floor((endAt.getTime() - now.getTime()) / 1000)) : null;
    const totalAttempts = attempts.length;
    const completed = attempts.filter((a) => a.status === "completed");
    const scores = completed.map((a) => a.score?.correctCount || 0);
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    return ok({
      totalAttempts,
      activeAttempts: attempts.filter((a) => a.status === "in_progress").length,
      averageScore: avg,
      lastSubmissionAt: completed.sort((a, b) => (a.submittedAt || 0) < (b.submittedAt || 0) ? 1 : -1)[0]?.submittedAt || null,
      endAt,
      remainingSeconds,
      status: quiz?.status || "draft"
    });
  } catch (error) {
    return handleError(error);
  }
}
