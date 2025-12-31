import { connectDb } from "../../../../../server/db";
import { ok, handleError } from "../../../../../server/http/response";
import { requireInstructor } from "../../../../../server/auth/requireInstructor";
import { Attempt } from "../../../../../server/models/Attempt";
import { assertQuizOwnership } from "../../../../../server/quizzes/quizService";
import { AuditLog } from "../../../../../server/models/AuditLog";

export async function PATCH(_: Request, { params }: { params: { attemptId: string } }) {
  try {
    const session = await requireInstructor();
    await connectDb();
    const attempt = await Attempt.findById(params.attemptId).lean();
    if (!attempt) {
      return ok({ error: "Attempt not found" }, 404);
    }
    await assertQuizOwnership(session.user.id, attempt.quizId.toString());
    await Attempt.updateOne(
      { _id: params.attemptId },
      { $set: { status: "forcibly_ended", submittedAt: new Date() } }
    );
    await AuditLog.create({
      quizId: attempt.quizId,
      type: "attempt_ended",
      message: `Attempt ended for ${attempt.studentEmail}`,
      meta: { attemptId: attempt._id.toString(), email: attempt.studentEmail }
    });
    return ok({ status: "ended" });
  } catch (error) {
    return handleError(error);
  }
}
