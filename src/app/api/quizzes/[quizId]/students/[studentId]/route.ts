import { NextRequest } from "next/server";
import { connectDb } from "../../../../../../server/db";
import { requireInstructor } from "../../../../../../server/auth/requireInstructor";
import { ok, handleError } from "../../../../../../server/http/response";
import { assertQuizOwnership } from "../../../../../../server/quizzes/quizService";
import { Student } from "../../../../../../server/models/Student";
import { Invitation } from "../../../../../../server/models/Invitation";

export async function PATCH(request: NextRequest, { params }: { params: { quizId: string; studentId: string } }) {
  try {
    const session = await requireInstructor();
    const body = await request.json();
    await connectDb();
    await assertQuizOwnership(session.user.id, params.quizId);
    const student = await Student.findOneAndUpdate(
      { _id: params.studentId, quizId: params.quizId },
      { $set: { email: body.email } },
      { new: true }
    ).lean();
    if (!student) {
      return ok({ error: "Student not found" }, 404);
    }
    await Invitation.updateMany(
      { quizId: params.quizId, studentId: student._id },
      { $set: { email: student.email } }
    );
    return ok(student);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { quizId: string; studentId: string } }) {
  try {
    const session = await requireInstructor();
    await connectDb();
    await assertQuizOwnership(session.user.id, params.quizId);
    const result = await Student.deleteOne({ _id: params.studentId, quizId: params.quizId });
    if (!result.deletedCount) {
      return ok({ error: "Student not found" }, 404);
    }
    await Invitation.deleteMany({ quizId: params.quizId, studentId: params.studentId });
    return ok({ status: "deleted" });
  } catch (error) {
    return handleError(error);
  }
}
