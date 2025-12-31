import { NextRequest } from "next/server";
import { connectDb } from "../../../../../server/db";
import { ok, handleError } from "../../../../../server/http/response";
import { requireInstructor } from "../../../../../server/auth/requireInstructor";
import { Quiz } from "../../../../../server/models/Quiz";
import { assertQuizOwnership } from "../../../../../server/quizzes/quizService";

export async function PATCH(request: NextRequest, { params }: { params: { quizId: string } }) {
  try {
    const session = await requireInstructor();
    const body = await request.json();
    await connectDb();
    await assertQuizOwnership(session.user.id, params.quizId);
    const quiz = await Quiz.findById(params.quizId);
    if (!quiz) {
      return ok({ error: "Quiz not found" }, 404);
    }
    const endAt = quiz.settings.endAt ? new Date(quiz.settings.endAt) : new Date();
    const minutes = Number(body.minutes || 0);
    quiz.settings.endAt = new Date(endAt.getTime() + minutes * 60000);
    await quiz.save();
    return ok({ status: "extended", endAt: quiz.settings.endAt });
  } catch (error) {
    return handleError(error);
  }
}
