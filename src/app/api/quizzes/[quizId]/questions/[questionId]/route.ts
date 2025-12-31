import { NextRequest } from "next/server";
import { connectDb } from "../../../../../../server/db";
import { requireInstructor } from "../../../../../../server/auth/requireInstructor";
import { ok, handleError } from "../../../../../../server/http/response";
import { assertQuizOwnership } from "../../../../../../server/quizzes/quizService";
import { Question } from "../../../../../../server/models/Question";

export async function PATCH(request: NextRequest, { params }: { params: { quizId: string; questionId: string } }) {
  try {
    const session = await requireInstructor();
    const body = await request.json();
    await connectDb();
    await assertQuizOwnership(session.user.id, params.quizId);
    const question = await Question.findOneAndUpdate(
      { _id: params.questionId, quizId: params.quizId },
      { $set: { text: body.text, options: body.options, correctIndex: body.correctIndex } },
      { new: true }
    ).lean();
    if (!question) {
      return ok({ error: "Question not found" }, 404);
    }
    return ok(question);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { quizId: string; questionId: string } }) {
  try {
    const session = await requireInstructor();
    await connectDb();
    await assertQuizOwnership(session.user.id, params.quizId);
    const result = await Question.deleteOne({ _id: params.questionId, quizId: params.quizId });
    if (!result.deletedCount) {
      return ok({ error: "Question not found" }, 404);
    }
    return ok({ status: "deleted" });
  } catch (error) {
    return handleError(error);
  }
}
