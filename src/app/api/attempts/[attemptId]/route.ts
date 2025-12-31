import { connectDb } from "../../../../server/db";
import { ok, handleError } from "../../../../server/http/response";
import { requireInstructor } from "../../../../server/auth/requireInstructor";
import { Attempt } from "../../../../server/models/Attempt";
import { Event } from "../../../../server/models/Event";
import { AttemptSnapshot } from "../../../../server/models/AttemptSnapshot";
import { assertQuizOwnership } from "../../../../server/quizzes/quizService";
import { AuditLog } from "../../../../server/models/AuditLog";

export async function DELETE(_: Request, { params }: { params: { attemptId: string } }) {
  try {
    const session = await requireInstructor();
    await connectDb();
    const attempt = await Attempt.findById(params.attemptId).lean();
    if (!attempt) {
      return ok({ error: "Attempt not found" }, 404);
    }
    await assertQuizOwnership(session.user.id, attempt.quizId.toString());
    await Promise.all([
      Attempt.deleteOne({ _id: params.attemptId }),
      Event.deleteMany({ attemptId: params.attemptId }),
      AttemptSnapshot.deleteMany({ attemptId: params.attemptId })
    ]);
    await AuditLog.create({
      quizId: attempt.quizId,
      type: "attempt_removed",
      message: `Attempt removed for ${attempt.studentEmail}`,
      meta: { attemptId: attempt._id.toString(), email: attempt.studentEmail }
    });
    return ok({ status: "deleted" });
  } catch (error) {
    return handleError(error);
  }
}
