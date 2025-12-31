import { connectDb } from "../../../../../server/db";
import { requireInstructor } from "../../../../../server/auth/requireInstructor";
import { ok, handleError } from "../../../../../server/http/response";
import { listStudents } from "../../../../../server/quizzes/studentService";
import { Student } from "../../../../../server/models/Student";
import { Invitation } from "../../../../../server/models/Invitation";
import { assertQuizOwnership } from "../../../../../server/quizzes/quizService";

export async function GET(_: Request, { params }: { params: { quizId: string } }) {
  try {
    const session = await requireInstructor();
    await connectDb();
    await assertQuizOwnership(session.user.id, params.quizId);
    const students = await listStudents(params.quizId);
    return ok(students);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_: Request, { params }: { params: { quizId: string } }) {
  try {
    const session = await requireInstructor();
    await connectDb();
    await assertQuizOwnership(session.user.id, params.quizId);
    await Promise.all([
      Student.deleteMany({ quizId: params.quizId }),
      Invitation.deleteMany({ quizId: params.quizId })
    ]);
    return ok({ status: "deleted" });
  } catch (error) {
    return handleError(error);
  }
}
