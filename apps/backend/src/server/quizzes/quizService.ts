import { Types } from "mongoose";
import { Quiz, QuizDocument, QuizSettings } from "../models/Quiz";
import { ApiError } from "../http/errors";

function normalizeSettings(settings?: Partial<QuizSettings>) {
  if (!settings) return settings;
  const normalized: Partial<QuizSettings> = { ...settings };
  if (typeof normalized.startAt === "string") {
    const startAt = new Date(normalized.startAt);
    normalized.startAt = Number.isNaN(startAt.getTime()) ? null : startAt;
  }
  if (typeof normalized.endAt === "string") {
    const endAt = new Date(normalized.endAt);
    normalized.endAt = Number.isNaN(endAt.getTime()) ? null : endAt;
  }
  return normalized;
}

export async function listQuizzes(instructorId: string) {
  const now = new Date();
  await Quiz.updateMany(
    { instructorId, status: "published", "settings.endAt": { $lt: now } },
    { $set: { status: "closed" } }
  );
  return Quiz.find({ instructorId }).lean();
}

export async function getQuiz(instructorId: string, quizId: string) {
  const quiz = await Quiz.findOne({ _id: quizId, instructorId }).lean();
  if (!quiz) {
    throw new ApiError("Quiz not found", 404);
  }
  return quiz;
}

export async function assertQuizOwnership(instructorId: string, quizId: string) {
  const quiz = await Quiz.findOne({ _id: quizId, instructorId }).select("_id").lean();
  if (!quiz) {
    throw new ApiError("Quiz not found", 404);
  }
}

export async function createQuiz(instructorId: string, payload: Partial<QuizDocument>) {
  const settings = normalizeSettings(payload.settings);
  const doc = await Quiz.create({
    instructorId: new Types.ObjectId(instructorId),
    title: payload.title,
    description: payload.description,
    quizCode: payload.quizCode,
    settings: settings || {},
    status: "draft"
  });
  return doc.toObject();
}

export async function updateQuiz(instructorId: string, quizId: string, payload: Partial<QuizDocument>) {
  const existing = await Quiz.findOne({ _id: quizId, instructorId }).lean();
  if (!existing) {
    throw new ApiError("Quiz not found", 404);
  }
  const settings = normalizeSettings(payload.settings);
  const mergedSettings = settings ? { ...existing.settings, ...settings } : undefined;
  const nextPayload = mergedSettings ? { ...payload, settings: mergedSettings } : payload;
  let updated = await Quiz.findOneAndUpdate(
    { _id: quizId, instructorId },
    { $set: nextPayload },
    { new: true }
  ).lean();
  if (payload.settings?.endAt && updated.status === "closed" && updated.settings?.endAt) {
    const now = new Date();
    const endAt = new Date(updated.settings.endAt);
    if (!Number.isNaN(endAt.getTime()) && endAt > now) {
      updated = await Quiz.findOneAndUpdate(
        { _id: quizId, instructorId },
        { $set: { status: "published" } },
        { new: true }
      ).lean();
    }
  }
  return updated;
}

export async function updateQuizStatus(instructorId: string, quizId: string, status: "draft" | "published" | "closed") {
  const updated = await Quiz.findOneAndUpdate(
    { _id: quizId, instructorId },
    { $set: { status } },
    { new: true }
  ).lean();
  if (!updated) {
    throw new ApiError("Quiz not found", 404);
  }
  return updated;
}
