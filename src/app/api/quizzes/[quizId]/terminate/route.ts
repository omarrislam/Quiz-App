import { connectDb } from "../../../../../server/db";
import { ok, handleError } from "../../../../../server/http/response";
import { requireInstructor } from "../../../../../server/auth/requireInstructor";
import { Attempt } from "../../../../../server/models/Attempt";
import { Quiz } from "../../../../../server/models/Quiz";
import { assertQuizOwnership } from "../../../../../server/quizzes/quizService";
import { AuditLog } from "../../../../../server/models/AuditLog";

export async function PATCH(_: Request, { params }: { params: { quizId: string } }) {
  try {
    const session = await requireInstructor();
    await connectDb();
    await assertQuizOwnership(session.user.id, params.quizId);
    await Quiz.findByIdAndUpdate(params.quizId, { status: "closed" });
    await Attempt.updateMany(
      { quizId: params.quizId, status: "in_progress" },
      { $set: { status: "forcibly_ended", submittedAt: new Date() } }
    );
    await AuditLog.create({
      quizId: params.quizId,
      type: "quiz_closed",
      message: "Quiz closed by instructor"
    });
    return ok({ status: "closed" });
  } catch (error) {
    return handleError(error);
  }
}
