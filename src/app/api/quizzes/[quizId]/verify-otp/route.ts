import { NextRequest } from "next/server";
import { connectDb } from "../../../../../server/db";
import { ok, handleError } from "../../../../../server/http/response";
import { verifyOtpAndStart } from "../../../../../server/quizzes/otpService";
import { Question } from "../../../../../server/models/Question";
import { ApiError } from "../../../../../server/http/errors";

function shuffleArray<T>(items: T[]) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function POST(request: NextRequest, { params }: { params: { quizId: string } }) {
  try {
    const body = await request.json();
    await connectDb();
    const { quiz, attempt } = await verifyOtpAndStart(params.quizId, body.email, body.otp);
    const questions = await Question.find({ quizId: quiz._id }).lean();
    if (questions.length === 0) {
      throw new ApiError("No questions uploaded for this quiz", 400);
    }
    const shuffledQuestions = quiz.settings.shuffleQuestions ? shuffleArray(questions) : questions;
    const payload = {
      attemptId: attempt._id.toString(),
      title: quiz.title,
      settings: {
        questionTimeSeconds: quiz.settings.questionTimeSeconds,
        showScoreToStudent: quiz.settings.showScoreToStudent,
        requireFullscreen: quiz.settings.requireFullscreen,
        logSuspiciousActivity: quiz.settings.logSuspiciousActivity,
        enableWebcamSnapshots: quiz.settings.enableWebcamSnapshots,
        totalTimeSeconds: quiz.settings.totalTimeSeconds || null
      },
      questions: shuffledQuestions.map((q) => ({
        id: q._id.toString(),
        text: q.text,
        options: quiz.settings.shuffleOptions ? shuffleArray(q.options) : q.options
      }))
    };
    return ok(payload);
  } catch (error) {
    return handleError(error);
  }
}
