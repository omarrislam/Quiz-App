import { NextRequest } from "next/server";
import { connectDb } from "../../../../../../server/db";
import { requireInstructor } from "../../../../../../server/auth/requireInstructor";
import { ok, handleError } from "../../../../../../server/http/response";
import { importQuestions } from "../../../../../../server/quizzes/questionService";
import { assertQuizOwnership } from "../../../../../../server/quizzes/quizService";
import * as XLSX from "xlsx";

function csvEscape(value: string) {
  const str = String(value ?? "");
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

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
        const sheetName = workbook.SheetNames.find((name) => name.toLowerCase() === "questions") || workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const range = sheet["!ref"] ? XLSX.utils.decode_range(sheet["!ref"]) : null;
        if (range) {
          const rows: string[][] = [];
          for (let r = range.s.r; r <= range.e.r; r += 1) {
            const row: string[] = [];
            for (let c = range.s.c; c <= range.e.c; c += 1) {
              const cell = sheet[XLSX.utils.encode_cell({ r, c })];
              row.push(cell ? String(cell.v ?? "") : "");
            }
            rows.push(row);
          }
          if (rows.length > 0) {
            const headers = rows[0].map((header) => String(header || "").trim());
            const normalizedHeaders = headers.length < 6 ? headers.concat(Array(6 - headers.length).fill("")) : headers;
            if (!normalizedHeaders.includes("Question")) {
              normalizedHeaders[0] = "Question";
            }
            const normalized = [normalizedHeaders.slice(0, 6), ...rows.slice(1).map((row) => {
              const full = row.length < 6 ? row.concat(Array(6 - row.length).fill("")) : row;
              return full.slice(0, 6);
            })];
            csv = normalized.map((row) => row.map(csvEscape).join(",")).join("\n");
          }
        }
      } else if (body.format === "csv" && body.data) {
        csv = body.data;
      }
    } else {
      csv = await request.text();
    }
    await connectDb();
    await assertQuizOwnership(session.user.id, params.quizId);
    const questions = await importQuestions(params.quizId, csv);
    return ok({ count: questions.length });
  } catch (error) {
    return handleError(error);
  }
}
