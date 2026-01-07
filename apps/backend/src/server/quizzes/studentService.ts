import { parse } from "csv-parse/sync";
import { Student } from "../models/Student";
import { ApiError } from "../http/errors";

export async function importStudents(quizId: string, csvContent: string) {
  const records = parse(csvContent, { columns: true, skip_empty_lines: true, trim: true, bom: true });
  if (!Array.isArray(records) || records.length === 0) {
    throw new ApiError("No students found in CSV", 400);
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const normalizedEmails = new Set<string>();
  const normalizedExternalIds = new Set<string>();
  const duplicates: string[] = [];
  const docs = records.map((row: Record<string, string>) => {
    const name = row.Name || row.name;
    const email = row.Email || row.email;
    const externalIdRaw = row.StudentId || row.studentId || null;
    const externalId = externalIdRaw ? String(externalIdRaw).trim() : null;
    if (!name || !email) {
      throw new ApiError("Each student needs Name and Email", 400);
    }
    if (!emailRegex.test(email)) {
      throw new ApiError(`Invalid email: ${email}`, 400);
    }
    const normalized = email.trim().toLowerCase();
    if (normalizedEmails.has(normalized)) {
      duplicates.push(email);
    }
    normalizedEmails.add(normalized);
    if (externalId) {
      if (normalizedExternalIds.has(externalId)) {
        duplicates.push(externalId);
      }
      normalizedExternalIds.add(externalId);
    }
    return { quizId, name, email, externalId };
  });
  if (duplicates.length) {
    throw new ApiError(`Duplicate entries in upload: ${duplicates.join(", ")}`, 400);
  }
  const existingExternalIds = new Set(
    (await Student.find({ quizId }).select("externalId").lean())
      .map((student) => student.externalId)
      .filter((externalId): externalId is string => Boolean(externalId))
  );
  for (const externalId of normalizedExternalIds) {
    if (existingExternalIds.has(externalId)) {
      throw new ApiError(`Student ID already exists: ${externalId}`, 400);
    }
  }
  const existing = await Student.find({ quizId, email: { $in: Array.from(normalizedEmails) } })
    .select("email")
    .lean();
  if (existing.length) {
    throw new ApiError(`Emails already exist: ${existing.map((s) => s.email).join(", ")}`, 400);
  }
  let maxNumericId = 0;
  for (const externalId of existingExternalIds) {
    const match = /^SID-(\d+)$/.exec(externalId);
    if (match) {
      maxNumericId = Math.max(maxNumericId, Number(match[1]));
    }
  }
  for (const doc of docs) {
    if (doc.externalId) continue;
    let generatedId = "";
    do {
      maxNumericId += 1;
      generatedId = `SID-${String(maxNumericId).padStart(4, "0")}`;
    } while (existingExternalIds.has(generatedId) || normalizedExternalIds.has(generatedId));
    doc.externalId = generatedId;
    normalizedExternalIds.add(generatedId);
  }
  await Student.insertMany(docs);
  return Student.find({ quizId }).lean();
}

export async function listStudents(quizId: string) {
  return Student.find({ quizId }).lean();
}
