import { NextRequest } from "next/server";
import { connectDb } from "../../../../../server/db";
import { ok, handleError } from "../../../../../server/http/response";
import { finishAttempt } from "../../../../../server/attempts/attemptService";

export async function POST(request: NextRequest, { params }: { params: { attemptId: string } }) {
  try {
    const body = await request.json();
    await connectDb();
    const result = await finishAttempt(params.attemptId, body.answers || []);
    return ok(result);
  } catch (error) {
    return handleError(error);
  }
}
