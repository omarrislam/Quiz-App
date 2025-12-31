import { NextRequest } from "next/server";
import { connectDb } from "../../../../../../server/db";
import { ok, handleError } from "../../../../../../server/http/response";
import { resendInvitation } from "../../../../../../server/quizzes/invitationService";

export async function POST(request: NextRequest, { params }: { params: { quizId: string } }) {
  try {
    const body = await request.json();
    await connectDb();
    await resendInvitation(params.quizId, body.email);
    return ok({ status: "sent" });
  } catch (error) {
    return handleError(error);
  }
}
