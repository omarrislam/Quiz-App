import { NextRequest } from "next/server";
import { connectDb } from "../../../server/db";
import { requireInstructor } from "../../../server/auth/requireInstructor";
import { ok, handleError } from "../../../server/http/response";
import { createQuiz, listQuizzes } from "../../../server/quizzes/quizService";

export async function GET() {
  try {
    const session = await requireInstructor();
    await connectDb();
    const quizzes = await listQuizzes(session.user.id);
    return ok(quizzes);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireInstructor();
    const body = await request.json();
    await connectDb();
    const quiz = await createQuiz(session.user.id, body);
    return ok(quiz, 201);
  } catch (error) {
    return handleError(error);
  }
}
