import { connectDb } from "../../../../../server/db";
import { requireInstructor } from "../../../../../server/auth/requireInstructor";
import { ok, handleError } from "../../../../../server/http/response";
import { listQuestions } from "../../../../../server/quizzes/questionService";
import { assertQuizOwnership } from "../../../../../server/quizzes/quizService";
import { Question } from "../../../../../server/models/Question";

export async function GET(_: Request, { params }: { params: { quizId: string } }) {
  try {
    const session = await requireInstructor();
    await connectDb();
    await assertQuizOwnership(session.user.id, params.quizId);
    const questions = await listQuestions(params.quizId);
    return ok(questions);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_: Request, { params }: { params: { quizId: string } }) {
  try {
    const session = await requireInstructor();
    await connectDb();
    await assertQuizOwnership(session.user.id, params.quizId);
    await Question.deleteMany({ quizId: params.quizId });
    return ok({ status: "deleted" });
  } catch (error) {
    return handleError(error);
  }
}
