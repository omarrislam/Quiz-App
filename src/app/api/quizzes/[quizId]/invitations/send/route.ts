import { connectDb } from "../../../../../../server/db";
import { requireInstructor } from "../../../../../../server/auth/requireInstructor";
import { ok, handleError } from "../../../../../../server/http/response";
import { sendInvitations } from "../../../../../../server/quizzes/invitationService";
import { assertQuizOwnership } from "../../../../../../server/quizzes/quizService";

export async function POST(_: Request, { params }: { params: { quizId: string } }) {
  try {
    const session = await requireInstructor();
    await connectDb();
    await assertQuizOwnership(session.user.id, params.quizId);
    await sendInvitations(params.quizId);
    return ok({ status: "queued" }, 202);
  } catch (error) {
    return handleError(error);
  }
}
