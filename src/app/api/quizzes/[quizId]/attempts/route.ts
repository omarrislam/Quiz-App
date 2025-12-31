import { connectDb } from "../../../../../server/db";
import { ok, handleError } from "../../../../../server/http/response";
import { requireInstructor } from "../../../../../server/auth/requireInstructor";
import { Attempt } from "../../../../../server/models/Attempt";
import { assertQuizOwnership } from "../../../../../server/quizzes/quizService";

export async function GET(_: Request, { params }: { params: { quizId: string } }) {
  try {
    const session = await requireInstructor();
    await connectDb();
    await assertQuizOwnership(session.user.id, params.quizId);
    const attempts = await Attempt.find({ quizId: params.quizId }).lean();
    return ok(attempts);
  } catch (error) {
    return handleError(error);
  }
}
