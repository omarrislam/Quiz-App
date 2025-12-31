import { connectDb } from "../../../../../server/db";
import { ok, handleError } from "../../../../../server/http/response";
import { Attempt } from "../../../../../server/models/Attempt";
import { Question } from "../../../../../server/models/Question";
import { AttemptSnapshot } from "../../../../../server/models/AttemptSnapshot";

export async function GET(_: Request, { params }: { params: { attemptId: string } }) {
  try {
    await connectDb();
    const attempt = await Attempt.findById(params.attemptId).lean();
    if (!attempt) {
      return ok({ error: "Attempt not found" }, 404);
    }
    const questions = await Question.find({ quizId: attempt.quizId }).lean();
    const map = new Map(questions.map((q) => [q._id.toString(), q]));
    const details = attempt.score?.details || [];
    const answers = details.map((detail) => {
      const q = map.get(detail.questionId.toString());
      return {
        question: q?.text || "Unknown question",
        options: q?.options || [],
        selectedIndex: detail.selectedIndex,
        correctIndex: q?.correctIndex ?? null
      };
    });
    const snapshots = await AttemptSnapshot.find({ attemptId: attempt._id })
      .sort({ createdAt: 1 })
      .lean();
    return ok({
      studentName: attempt.studentName,
      studentEmail: attempt.studentEmail,
      status: attempt.status,
      score: attempt.score,
      answers,
      snapshots: snapshots.map((snapshot) => ({
        phase: snapshot.phase,
        mime: snapshot.mime,
        data: snapshot.data,
        createdAt: snapshot.createdAt
      }))
    });
  } catch (error) {
    return handleError(error);
  }
}
