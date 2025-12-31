import { Types } from "mongoose";
import { Attempt } from "../models/Attempt";
import { Event } from "../models/Event";
import { Question } from "../models/Question";
import { ApiError } from "../http/errors";

export async function recordEvent(attemptId: string, type: string, message?: string, extra?: Record<string, unknown>) {
  const attempt = await Attempt.findById(attemptId);
  if (!attempt) {
    throw new ApiError("Attempt not found", 404);
  }
  if (attempt.status !== "in_progress") {
    return;
  }
  await Event.create({
    quizId: attempt.quizId,
    attemptId: attempt._id,
    type,
    message,
    timestamp: new Date(),
    extra: extra || {}
  });
  attempt.flags.suspiciousEventsCount += 1;
  await attempt.save();
}

export async function finishAttempt(attemptId: string, answers: { questionId: string; selectedIndex: number | null }[]) {
  const attempt = await Attempt.findById(attemptId);
  if (!attempt) {
    throw new ApiError("Attempt not found", 404);
  }
  if (attempt.status !== "in_progress") {
    throw new ApiError("Attempt already ended", 403);
  }
  const questions = await Question.find({ quizId: attempt.quizId }).lean();
  const map = new Map(questions.map((q) => [q._id.toString(), q]));

  const details = answers.map((answer) => {
    const question = map.get(answer.questionId);
    const correctIndex = question ? question.correctIndex : -1;
    const isCorrect = answer.selectedIndex !== null && answer.selectedIndex === correctIndex;
    const questionId = Types.ObjectId.isValid(answer.questionId)
      ? new Types.ObjectId(answer.questionId)
      : new Types.ObjectId();
    return {
      questionId,
      selectedIndex: answer.selectedIndex,
      isCorrect
    };
  });

  const correctCount = details.filter((d) => d.isCorrect).length;
  const totalQuestions = questions.length;

  attempt.score = { correctCount, totalQuestions, details };
  attempt.status = "completed";
  attempt.submittedAt = new Date();
  await attempt.save();

  return { correctCount, totalQuestions };
}
