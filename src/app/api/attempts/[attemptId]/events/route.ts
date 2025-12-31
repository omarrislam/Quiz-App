import { NextRequest } from "next/server";
import { connectDb } from "../../../../../server/db";
import { ok, handleError } from "../../../../../server/http/response";
import { recordEvent } from "../../../../../server/attempts/attemptService";

export async function POST(request: NextRequest, { params }: { params: { attemptId: string } }) {
  try {
    const body = await request.json();
    await connectDb();
    await recordEvent(params.attemptId, body.type, body.message, body.extra);
    return ok({ status: "ok" }, 201);
  } catch (error) {
    return handleError(error);
  }
}
