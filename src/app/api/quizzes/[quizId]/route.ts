import { NextRequest } from "next/server";
import { connectDb } from "../../../../server/db";
import { requireInstructor } from "../../../../server/auth/requireInstructor";
import { ok, handleError } from "../../../../server/http/response";
import { getQuiz, updateQuiz } from "../../../../server/quizzes/quizService";
import { Quiz } from "../../../../server/models/Quiz";
import { Question } from "../../../../server/models/Question";
import { Student } from "../../../../server/models/Student";
import { Invitation } from "../../../../server/models/Invitation";
import { Attempt } from "../../../../server/models/Attempt";
import { Event } from "../../../../server/models/Event";
import { AttemptSnapshot } from "../../../../server/models/AttemptSnapshot";

export async function GET(_: NextRequest, { params }: { params: { quizId: string } }) {
  try {
    const session = await requireInstructor();
    await connectDb();
    const quiz = await getQuiz(session.user.id, params.quizId);
    return ok(quiz);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { quizId: string } }) {
  try {
    const session = await requireInstructor();
    const body = await request.json();
    await connectDb();
    const quiz = await updateQuiz(session.user.id, params.quizId, body);
    return ok(quiz);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { quizId: string } }) {
  try {
    const session = await requireInstructor();
    await connectDb();
    const quiz = await Quiz.findOne({ _id: params.quizId, instructorId: session.user.id });
    if (!quiz) {
      return ok({ error: "Quiz not found" }, 404);
    }
    await Promise.all([
      Quiz.deleteOne({ _id: params.quizId }),
      Question.deleteMany({ quizId: params.quizId }),
      Student.deleteMany({ quizId: params.quizId }),
      Invitation.deleteMany({ quizId: params.quizId }),
      Attempt.deleteMany({ quizId: params.quizId }),
      Event.deleteMany({ quizId: params.quizId }),
      AttemptSnapshot.deleteMany({ quizId: params.quizId })
    ]);
    return ok({ status: "deleted" });
  } catch (error) {
    return handleError(error);
  }
}
