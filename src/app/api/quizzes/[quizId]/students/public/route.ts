import { connectDb } from "../../../../../../server/db";
import { ok, handleError } from "../../../../../../server/http/response";
import { Student } from "../../../../../../server/models/Student";

export async function GET(request: Request, { params }: { params: { quizId: string } }) {
  try {
    await connectDb();
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("q") || "").trim();
    const filter = query
      ? { quizId: params.quizId, name: { $regex: query, $options: "i" } }
      : { quizId: params.quizId };
    const students = await Student.find(filter).select("name email").limit(20).lean();
    return ok(students);
  } catch (error) {
    return handleError(error);
  }
}
