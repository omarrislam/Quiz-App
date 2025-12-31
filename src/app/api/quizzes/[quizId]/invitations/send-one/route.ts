import { connectDb } from "../../../../../../server/db";
import { requireInstructor } from "../../../../../../server/auth/requireInstructor";
import { ok, handleError } from "../../../../../../server/http/response";
import { sendInvitationToStudent } from "../../../../../../server/quizzes/invitationService";
import { assertQuizOwnership } from "../../../../../../server/quizzes/quizService";

export async function POST(request: Request, { params }: { params: { quizId: string } }) {
  try {
    const session = await requireInstructor();
    const body = await request.json();
    await connectDb();
    await assertQuizOwnership(session.user.id, params.quizId);
    await sendInvitationToStudent(params.quizId, body.email);
    return ok({ status: "queued" }, 202);
  } catch (error) {
    return handleError(error);
  }
}
