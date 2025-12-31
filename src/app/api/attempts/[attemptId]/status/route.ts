import { connectDb } from "../../../../../server/db";
import { ok, handleError } from "../../../../../server/http/response";
import { Attempt } from "../../../../../server/models/Attempt";

export async function GET(_: Request, { params }: { params: { attemptId: string } }) {
  try {
    await connectDb();
    const attempt = await Attempt.findById(params.attemptId).lean();
    if (!attempt) {
      return ok({ error: "Attempt not found" }, 404);
    }
    return ok({ status: attempt.status });
  } catch (error) {
    return handleError(error);
  }
}
