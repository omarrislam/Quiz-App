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
  const duplicates: string[] = [];
  const docs = records.map((row: Record<string, string>) => {
    const name = row.Name || row.name;
    const email = row.Email || row.email;
    const externalId = row.StudentId || row.studentId || null;
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
    return { quizId, name, email, externalId };
  });
  if (duplicates.length) {
    throw new ApiError(`Duplicate emails in upload: ${duplicates.join(", ")}`, 400);
  }
  const existing = await Student.find({ quizId, email: { $in: Array.from(normalizedEmails) } })
    .select("email")
    .lean();
  if (existing.length) {
    throw new ApiError(`Emails already exist: ${existing.map((s) => s.email).join(", ")}`, 400);
  }
  const created = await Student.insertMany(docs);
  const updates = created.map((student, index) => {
    const generatedId = `SID-${String(index + 1).padStart(4, "0")}`;
    if (student.externalId) {
      return null;
    }
    return Student.updateOne({ _id: student._id }, { $set: { externalId: generatedId } });
  });
  await Promise.all(updates.filter(Boolean));
  return Student.find({ quizId }).lean();
}

export async function listStudents(quizId: string) {
  return Student.find({ quizId }).lean();
}
