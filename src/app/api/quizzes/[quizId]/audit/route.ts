import { connectDb } from "../../../../../server/db";
import { ok, handleError } from "../../../../../server/http/response";
import { requireInstructor } from "../../../../../server/auth/requireInstructor";
import { assertQuizOwnership } from "../../../../../server/quizzes/quizService";
import { AuditLog } from "../../../../../server/models/AuditLog";
import { Event } from "../../../../../server/models/Event";
import { Attempt } from "../../../../../server/models/Attempt";

export async function GET(_: Request, { params }: { params: { quizId: string } }) {
  try {
    const session = await requireInstructor();
    await connectDb();
    await assertQuizOwnership(session.user.id, params.quizId);
    const [auditLogs, fullscreenEvents] = await Promise.all([
      AuditLog.find({ quizId: params.quizId }).sort({ createdAt: -1 }).limit(200).lean(),
      Event.find({ quizId: params.quizId, type: "fullscreen_exit" }).sort({ timestamp: -1 }).limit(200).lean()
    ]);
    const attemptIds = fullscreenEvents.map((event) => event.attemptId);
    const attempts = await Attempt.find({ _id: { $in: attemptIds } }).lean();
    const attemptMap = new Map(attempts.map((attempt) => [attempt._id.toString(), attempt]));

    const merged = [
      ...auditLogs.map((log) => ({
        id: log._id.toString(),
        type: log.type,
        message: log.message,
        timestamp: log.createdAt || log.updatedAt || new Date(),
        studentName: null,
        studentEmail: log.meta?.email || null
      })),
      ...fullscreenEvents.map((event) => {
        const attempt = attemptMap.get(event.attemptId.toString());
        return {
          id: event._id.toString(),
          type: "fullscreen_exit",
          message: event.message || "Fullscreen exited",
          timestamp: event.timestamp,
          studentName: attempt?.studentName || null,
          studentEmail: attempt?.studentEmail || null
        };
      })
    ].sort((a, b) => (a.timestamp > b.timestamp ? -1 : 1));

    return ok(merged);
  } catch (error) {
    return handleError(error);
  }
}
