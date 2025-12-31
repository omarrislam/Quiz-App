import { NextRequest } from "next/server";
import { connectDb } from "../../../../../../server/db";
import { requireInstructor } from "../../../../../../server/auth/requireInstructor";
import { ok, handleError } from "../../../../../../server/http/response";
import { importStudents } from "../../../../../../server/quizzes/studentService";
import { assertQuizOwnership } from "../../../../../../server/quizzes/quizService";
import * as XLSX from "xlsx";

export async function POST(request: NextRequest, { params }: { params: { quizId: string } }) {
  try {
    const session = await requireInstructor();
    const contentType = request.headers.get("content-type") || "";
    let csv = "";
    if (contentType.includes("application/json")) {
      const body = await request.json();
      if (body.format === "xlsx" && body.data) {
        const buffer = Buffer.from(body.data, "base64");
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames.find((name) => name.toLowerCase() === "students") || workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        csv = XLSX.utils.sheet_to_csv(sheet);
      } else if (body.format === "csv" && body.data) {
        csv = body.data;
      }
    } else {
      csv = await request.text();
    }
    await connectDb();
    await assertQuizOwnership(session.user.id, params.quizId);
    const students = await importStudents(params.quizId, csv);
    return ok({ count: students.length });
  } catch (error) {
    return handleError(error);
  }
}
