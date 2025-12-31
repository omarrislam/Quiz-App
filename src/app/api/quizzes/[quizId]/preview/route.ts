import { connectDb } from "../../../../../server/db";
import { ok, handleError } from "../../../../../server/http/response";
import { requireInstructor } from "../../../../../server/auth/requireInstructor";
import { assertQuizOwnership } from "../../../../../server/quizzes/quizService";
import { Question } from "../../../../../server/models/Question";
import { Quiz } from "../../../../../server/models/Quiz";

function shuffleArray<T>(items: T[]) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function GET(_: Request, { params }: { params: { quizId: string } }) {
  try {
    const session = await requireInstructor();
    await connectDb();
    await assertQuizOwnership(session.user.id, params.quizId);
    const quiz = await Quiz.findById(params.quizId).lean();
    if (!quiz) {
      return ok({ error: "Quiz not found" }, 404);
    }
    const questions = await Question.find({ quizId: params.quizId }).lean();
    const shuffledQuestions = quiz.settings.shuffleQuestions ? shuffleArray(questions) : questions;
    return ok({
      title: quiz.title,
      settings: {
        questionTimeSeconds: quiz.settings.questionTimeSeconds,
        shuffleOptions: quiz.settings.shuffleOptions
      },
      questions: shuffledQuestions.map((q) => ({
        id: q._id.toString(),
        text: q.text,
        options: quiz.settings.shuffleOptions ? shuffleArray(q.options) : q.options
      }))
    });
  } catch (error) {
    return handleError(error);
  }
}
