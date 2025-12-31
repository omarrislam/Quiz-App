import { parse } from "csv-parse/sync";
import { Question } from "../models/Question";
import { ApiError } from "../http/errors";

export async function importQuestions(quizId: string, csvContent: string) {
  if (!csvContent || !csvContent.trim()) {
    throw new ApiError("CSV is empty", 400);
  }
  let records: Record<string, string>[];
  try {
    records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
      relax_column_count: true
    });
  } catch (error) {
    throw new ApiError("CSV parse error. Check headers and commas.", 400);
  }
  if (!Array.isArray(records) || records.length === 0) {
    throw new ApiError("No questions found in CSV", 400);
  }
  const meaningfulRecords = records.filter((row) => {
    const values = Object.values(row || {}).map((value) => String(value || "").trim());
    return values.some((value) => value.length > 0);
  });
  if (meaningfulRecords.length === 0) {
    throw new ApiError("No questions found in CSV", 400);
  }
  const docs = meaningfulRecords.map((row: Record<string, string>, idx: number) => {
    const text = String(row.Question || row.question || "").trim();
    const options = [row.OptionA, row.OptionB, row.OptionC, row.OptionD].filter(
      (value) => Boolean(value && String(value).trim())
    );
    if (!text || options.length < 2) {
      throw new ApiError(
        `Invalid row ${idx + 1}. Each question needs text and at least 2 options. If your question contains commas, wrap the question in double quotes.`,
        400
      );
    }
    const correctLetter = (row.CorrectLetter || "A").toUpperCase();
    const correctIndex = ["A", "B", "C", "D"].indexOf(correctLetter);
    return {
      quizId,
      text,
      options,
      correctIndex: correctIndex >= 0 ? correctIndex : 0,
      order: idx + 1
    };
  });
  return Question.insertMany(docs);
}

export async function listQuestions(quizId: string) {
  return Question.find({ quizId }).sort({ order: 1 }).lean();
}
