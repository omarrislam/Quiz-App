import { connectDb } from "../../../../../server/db";
import { ok, handleError } from "../../../../../server/http/response";
import { Quiz } from "../../../../../server/models/Quiz";

export async function GET(_: Request, { params }: { params: { quizId: string } }) {
  try {
    await connectDb();
    const quiz = await Quiz.findById(params.quizId).lean();
    if (!quiz) {
      return ok({ error: "Quiz not found" }, 404);
    }
    return ok({
      title: quiz.title,
      questionTimeSeconds: quiz.settings?.questionTimeSeconds || 35
    });
  } catch (error) {
    return handleError(error);
  }
}
