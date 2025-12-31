import { NextRequest } from "next/server";
import { connectDb } from "../../../../../server/db";
import { requireInstructor } from "../../../../../server/auth/requireInstructor";
import { ok, handleError } from "../../../../../server/http/response";
import { updateQuizStatus } from "../../../../../server/quizzes/quizService";

export async function PATCH(request: NextRequest, { params }: { params: { quizId: string } }) {
  try {
    const session = await requireInstructor();
    const body = await request.json();
    await connectDb();
    const quiz = await updateQuizStatus(session.user.id, params.quizId, body.status);
    return ok(quiz);
  } catch (error) {
    return handleError(error);
  }
}
