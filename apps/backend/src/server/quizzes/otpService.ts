import { Invitation } from "../models/Invitation";
import { Student } from "../models/Student";
import { Quiz } from "../models/Quiz";
import { Attempt } from "../models/Attempt";
import { ApiError } from "../http/errors";
import { verifyOtp } from "../security/otp";

export async function verifyOtpAndStart(quizIdOrCode: string, email: string, otp: string) {
  const quiz = await Quiz.findOne({ $or: [{ _id: quizIdOrCode }, { quizCode: quizIdOrCode }] }).lean();
  if (!quiz) {
    throw new ApiError("Quiz not found", 404);
  }
  if (quiz.status === "closed") {
    throw new ApiError("Quiz is closed", 403);
  }
  if (quiz.status === "draft") {
    throw new ApiError("Quiz is not published yet", 403);
  }

  const invitation = await Invitation.findOne({ quizId: quiz._id, email });
  if (!invitation) {
    throw new ApiError("Invitation not found", 404);
  }

  const now = new Date();
  if (quiz.settings.startAt && now < new Date(quiz.settings.startAt)) {
    throw new ApiError("Quiz has not started yet", 403);
  }
  if (quiz.settings.endAt && now > new Date(quiz.settings.endAt)) {
    throw new ApiError("Quiz has ended", 403);
  }

  if (invitation.otpExpiresAt < new Date()) {
    throw new ApiError("OTP expired", 400);
  }

  if (invitation.otpAttempts >= invitation.maxOtpAttempts) {
    throw new ApiError("OTP attempts exceeded", 429);
  }

  if (!verifyOtp(invitation.otpCodeHash, otp)) {
    invitation.otpAttempts += 1;
    await invitation.save();
    throw new ApiError("Invalid OTP", 400);
  }

  const student = await Student.findOne({ quizId: quiz._id, email }).lean();
  if (!student && quiz.settings.requireStudentListMatch) {
    throw new ApiError("Student not found", 403);
  }

  if (!quiz.settings.allowMultipleAttempts) {
    const existing = await Attempt.findOne({ quizId: quiz._id, studentEmail: email, status: "completed" }).lean();
    if (existing) {
      throw new ApiError("Attempt already completed", 403);
    }
  }

  invitation.verifiedAt = new Date();
  invitation.otpAttempts = 0;
  await invitation.save();

  const attempt = await Attempt.create({
    quizId: quiz._id,
    studentId: student?._id || null,
    inviteId: invitation._id,
    studentName: student?.name || email,
    studentEmail: email,
    startedAt: new Date(),
    status: "in_progress",
    score: { correctCount: 0, totalQuestions: 0, details: [] },
    flags: { suspiciousEventsCount: 0 }
  });

  return { quiz, attempt };
}
