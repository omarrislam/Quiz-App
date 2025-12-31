import { NextRequest } from "next/server";
import { connectDb } from "../../../../../../server/db";
import { requireInstructor } from "../../../../../../server/auth/requireInstructor";
import { ok, handleError } from "../../../../../../server/http/response";
import { resendInvitation } from "../../../../../../server/quizzes/invitationService";
import { assertQuizOwnership } from "../../../../../../server/quizzes/quizService";

export async function POST(request: NextRequest, { params }: { params: { quizId: string } }) {
  try {
    const session = await requireInstructor();
    const body = await request.json();
    await connectDb();
    await assertQuizOwnership(session.user.id, params.quizId);
    await resendInvitation(params.quizId, body.email);
    return ok({ status: "sent" });
  } catch (error) {
    return handleError(error);
  }
}
