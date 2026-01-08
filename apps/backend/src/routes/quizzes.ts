import { Router } from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { connectDb } from "../server/db";
import { handleError, ok } from "../http/response";
import { requireAuth } from "../middleware/auth";
import { createQuiz, getQuiz, listQuizzes, updateQuiz, updateQuizStatus, assertQuizOwnership } from "../server/quizzes/quizService";
import { importStudents, listStudents } from "../server/quizzes/studentService";
import { importQuestions, listQuestions } from "../server/quizzes/questionService";
import { sendInvitations, sendInvitationToStudent, resendInvitation } from "../server/quizzes/invitationService";
import { verifyOtpAndStart } from "../server/quizzes/otpService";
import { exportAttemptsCsv } from "../server/quizzes/exportService";
import { Question } from "../server/models/Question";
import { Quiz } from "../server/models/Quiz";
import { Student } from "../server/models/Student";
import { Invitation } from "../server/models/Invitation";
import { Attempt } from "../server/models/Attempt";
import { Event } from "../server/models/Event";
import { AuditLog } from "../server/models/AuditLog";
import { AttemptSnapshot } from "../server/models/AttemptSnapshot";
import { SecondCamSnapshot } from "../server/models/SecondCamSnapshot";
import { SecondCamSession } from "../server/models/SecondCamSession";
import { ApiError } from "../server/http/errors";

function shuffleArray<T>(items: T[]) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const quizzesRouter = Router();

// Public/student routes
quizzesRouter.get("/:quizId/public", async (req, res) => {
  try {
    await connectDb();
    const quiz = await Quiz.findById(req.params.quizId).lean();
    if (!quiz) {
      return ok(res, { error: "Quiz not found" }, 404);
    }
    return ok(res, {
      title: quiz.title,
      questionTimeSeconds: quiz.settings?.questionTimeSeconds || 35,
      enableWebcamSnapshots: Boolean(quiz.settings?.enableWebcamSnapshots),
      enableFaceCentering: Boolean(quiz.settings?.enableFaceCentering),
      enableSecondCam: Boolean(quiz.settings?.enableSecondCam),
      mobileAllowed: quiz.settings?.mobileAllowed !== false
    });
  } catch (error) {
    return handleError(res, error);
  }
});

quizzesRouter.get("/:quizId/students/public", async (req, res) => {
  try {
    await connectDb();
    const q = String(req.query.q || "").trim();
    const filter = q ? { quizId: req.params.quizId, name: new RegExp(q, "i") } : { quizId: req.params.quizId };
    const students = await Student.find(filter).select("name email").limit(20).lean();
    return ok(res, students);
  } catch (error) {
    return handleError(res, error);
  }
});

quizzesRouter.get("/:quizId/invitations/:inviteId/public", async (req, res) => {
  try {
    await connectDb();
    const rawInviteId = String(req.params.inviteId || "");
    const match = rawInviteId.match(/[a-fA-F0-9]{24}/);
    if (!match || !mongoose.Types.ObjectId.isValid(match[0])) {
      return ok(res, { error: "Invalid invitation link" }, 400);
    }
    const invitation = await Invitation.findOne({ _id: match[0], quizId: req.params.quizId }).lean();
    if (!invitation) {
      return ok(res, { error: "Invitation not found" }, 404);
    }
    const student = await Student.findById(invitation.studentId).lean();
    if (!student) {
      return ok(res, { error: "Student not found" }, 404);
    }
    return ok(res, { name: student.name, email: student.email });
  } catch (error) {
    return handleError(res, error);
  }
});

quizzesRouter.post("/:quizId/invitations/resend-otp", async (req, res) => {
  try {
    await connectDb();
    await resendInvitation(req.params.quizId, req.body?.email);
    return ok(res, { status: "sent" });
  } catch (error) {
    return handleError(res, error);
  }
});

quizzesRouter.post("/:quizId/verify-otp", async (req, res) => {
  try {
    await connectDb();
    const { quiz, attempt } = await verifyOtpAndStart(
      req.params.quizId,
      req.body?.email,
      req.body?.otp,
      req.get("user-agent")
    );
    const questions = await Question.find({ quizId: quiz._id }).lean();
    if (questions.length === 0) {
      throw new ApiError("No questions uploaded for this quiz", 400);
    }
    const shuffledQuestions = quiz.settings.shuffleQuestions ? shuffleArray(questions) : questions;
    const secondCamEnabled = Boolean(quiz.settings.enableSecondCam);
    const secret = process.env.JWT_SECRET || "";
    const secondCamToken = secondCamEnabled && secret
      ? jwt.sign(
        { sub: attempt._id.toString(), type: "second_cam" },
        secret,
        { expiresIn: "6h" }
      )
      : null;
    return ok(res, {
      attemptId: attempt._id.toString(),
      title: quiz.title,
      settings: {
        questionTimeSeconds: quiz.settings.questionTimeSeconds,
        showScoreToStudent: quiz.settings.showScoreToStudent,
        requireFullscreen: quiz.settings.requireFullscreen,
        logSuspiciousActivity: quiz.settings.logSuspiciousActivity,
        enableWebcamSnapshots: quiz.settings.enableWebcamSnapshots,
        enableFaceCentering: quiz.settings.enableFaceCentering,
        enableSecondCam: quiz.settings.enableSecondCam,
        mobileAllowed: quiz.settings.mobileAllowed !== false,
        totalTimeSeconds: quiz.settings.totalTimeSeconds || null
      },
      secondCamToken,
      questions: shuffledQuestions.map((q) => ({
        id: q._id.toString(),
        text: q.text,
        options: quiz.settings.shuffleOptions ? shuffleArray(q.options) : q.options
      }))
    });
  } catch (error) {
    return handleError(res, error);
  }
});

// Instructor-protected routes
quizzesRouter.use(requireAuth);

quizzesRouter.get("/", async (req, res) => {
  try {
    const userId = (req as any).user?.sub || "";
    await connectDb();
    const quizzes = await listQuizzes(userId);
    return ok(res, quizzes);
  } catch (error) {
    return handleError(res, error);
  }
});

quizzesRouter.post("/", async (req, res) => {
  try {
    const userId = (req as any).user?.sub || "";
    await connectDb();
    const quiz = await createQuiz(userId, req.body || {});
    return ok(res, quiz, 201);
  } catch (error) {
    return handleError(res, error);
  }
});

quizzesRouter.get("/:quizId", async (req, res) => {
  try {
    const userId = (req as any).user?.sub || "";
    await connectDb();
    const quiz = await getQuiz(userId, req.params.quizId);
    return ok(res, quiz);
  } catch (error) {
    return handleError(res, error);
  }
});

quizzesRouter.patch("/:quizId", async (req, res) => {
  try {
    const userId = (req as any).user?.sub || "";
    await connectDb();
    const quiz = await updateQuiz(userId, req.params.quizId, req.body || {});
    return ok(res, quiz);
  } catch (error) {
    return handleError(res, error);
  }
});

quizzesRouter.delete("/:quizId", async (req, res) => {
  try {
    const userId = (req as any).user?.sub || "";
    await connectDb();
    const quiz = await Quiz.findOne({ _id: req.params.quizId, instructorId: userId });
    if (!quiz) {
      return ok(res, { error: "Quiz not found" }, 404);
    }
    await Promise.all([
      Quiz.deleteOne({ _id: req.params.quizId }),
      Question.deleteMany({ quizId: req.params.quizId }),
      Student.deleteMany({ quizId: req.params.quizId }),
      Invitation.deleteMany({ quizId: req.params.quizId }),
      Attempt.deleteMany({ quizId: req.params.quizId }),
      Event.deleteMany({ quizId: req.params.quizId }),
      AttemptSnapshot.deleteMany({ quizId: req.params.quizId }),
      SecondCamSnapshot.deleteMany({ quizId: req.params.quizId }),
      SecondCamSession.deleteMany({ quizId: req.params.quizId })
    ]);
    return ok(res, { status: "deleted" });
  } catch (error) {
    return handleError(res, error);
  }
});

quizzesRouter.patch("/:quizId/status", async (req, res) => {
  try {
    const userId = (req as any).user?.sub || "";
    await connectDb();
    const quiz = await updateQuizStatus(userId, req.params.quizId, req.body?.status);
    return ok(res, quiz);
  } catch (error) {
    return handleError(res, error);
  }
});

quizzesRouter.get("/:quizId/preview", async (req, res) => {
  try {
    const userId = (req as any).user?.sub || "";
    await connectDb();
    await assertQuizOwnership(userId, req.params.quizId);
    const quiz = await Quiz.findById(req.params.quizId).lean();
    if (!quiz) {
      return ok(res, { error: "Quiz not found" }, 404);
    }
    const questions = await Question.find({ quizId: req.params.quizId }).lean();
    const shuffledQuestions = quiz.settings.shuffleQuestions ? shuffleArray(questions) : questions;
    return ok(res, {
      title: quiz.title,
      settings: {
        questionTimeSeconds: quiz.settings.questionTimeSeconds,
        shuffleOptions: quiz.settings.shuffleOptions
      },
      questions: shuffledQuestions.map((q) => ({
        id: q._id.toString(),
        text: q.text,
        options: quiz.settings.shuffleOptions ? shuffleArray(q.options) : q.options
      }))
    });
  } catch (error) {
    return handleError(res, error);
  }
});

quizzesRouter.get("/:quizId/questions", async (req, res) => {
  try {
    const userId = (req as any).user?.sub || "";
    await connectDb();
    await assertQuizOwnership(userId, req.params.quizId);
    const questions = await listQuestions(req.params.quizId);
    return ok(res, questions);
  } catch (error) {
    return handleError(res, error);
  }
});

quizzesRouter.post("/:quizId/questions/upload", async (req, res) => {
  try {
    const userId = (req as any).user?.sub || "";
    await connectDb();
    await assertQuizOwnership(userId, req.params.quizId);
    const csv = typeof req.body === "string" ? req.body : JSON.stringify(req.body || "");
    const questions = await importQuestions(req.params.quizId, csv);
    return ok(res, { count: questions.length });
  } catch (error) {
    return handleError(res, error);
  }
});

quizzesRouter.patch("/:quizId/questions/:questionId", async (req, res) => {
  try {
    const userId = (req as any).user?.sub || "";
    await connectDb();
    await assertQuizOwnership(userId, req.params.quizId);
    const updated = await Question.findOneAndUpdate(
      { _id: req.params.questionId, quizId: req.params.quizId },
      { $set: req.body || {} },
      { new: true }
    ).lean();
    if (!updated) {
      return ok(res, { error: "Question not found" }, 404);
    }
    return ok(res, updated);
  } catch (error) {
    return handleError(res, error);
  }
});

quizzesRouter.delete("/:quizId/questions/:questionId", async (req, res) => {
  try {
    const userId = (req as any).user?.sub || "";
    await connectDb();
    await assertQuizOwnership(userId, req.params.quizId);
    await Question.deleteOne({ _id: req.params.questionId, quizId: req.params.quizId });
    return ok(res, { status: "deleted" });
  } catch (error) {
    return handleError(res, error);
  }
});

quizzesRouter.delete("/:quizId/questions", async (req, res) => {
  try {
    const userId = (req as any).user?.sub || "";
    await connectDb();
    await assertQuizOwnership(userId, req.params.quizId);
    await Question.deleteMany({ quizId: req.params.quizId });
    return ok(res, { status: "deleted" });
  } catch (error) {
    return handleError(res, error);
  }
});

quizzesRouter.get("/:quizId/students", async (req, res) => {
  try {
    const userId = (req as any).user?.sub || "";
    await connectDb();
    await assertQuizOwnership(userId, req.params.quizId);
    const students = await listStudents(req.params.quizId);
    return ok(res, students);
  } catch (error) {
    return handleError(res, error);
  }
});

quizzesRouter.post("/:quizId/students/upload", async (req, res) => {
  try {
    const userId = (req as any).user?.sub || "";
    await connectDb();
    await assertQuizOwnership(userId, req.params.quizId);
    const csv = typeof req.body === "string" ? req.body : JSON.stringify(req.body || "");
    const students = await importStudents(req.params.quizId, csv);
    return ok(res, { count: students.length });
  } catch (error) {
    return handleError(res, error);
  }
});

quizzesRouter.patch("/:quizId/students/:studentId", async (req, res) => {
  try {
    const userId = (req as any).user?.sub || "";
    await connectDb();
    await assertQuizOwnership(userId, req.params.quizId);
    const updated = await Student.findOneAndUpdate(
      { _id: req.params.studentId, quizId: req.params.quizId },
      { $set: req.body || {} },
      { new: true }
    ).lean();
    if (!updated) {
      return ok(res, { error: "Student not found" }, 404);
    }
    return ok(res, updated);
  } catch (error) {
    return handleError(res, error);
  }
});

quizzesRouter.delete("/:quizId/students/:studentId", async (req, res) => {
  try {
    const userId = (req as any).user?.sub || "";
    await connectDb();
    await assertQuizOwnership(userId, req.params.quizId);
    await Student.deleteOne({ _id: req.params.studentId, quizId: req.params.quizId });
    await Invitation.deleteOne({ studentId: req.params.studentId, quizId: req.params.quizId });
    return ok(res, { status: "deleted" });
  } catch (error) {
    return handleError(res, error);
  }
});

quizzesRouter.delete("/:quizId/students", async (req, res) => {
  try {
    const userId = (req as any).user?.sub || "";
    await connectDb();
    await assertQuizOwnership(userId, req.params.quizId);
    await Promise.all([
      Student.deleteMany({ quizId: req.params.quizId }),
      Invitation.deleteMany({ quizId: req.params.quizId })
    ]);
    return ok(res, { status: "deleted" });
  } catch (error) {
    return handleError(res, error);
  }
});

quizzesRouter.post("/:quizId/invitations/send", async (req, res) => {
  try {
    const userId = (req as any).user?.sub || "";
    await connectDb();
    await assertQuizOwnership(userId, req.params.quizId);
    await sendInvitations(req.params.quizId);
    return ok(res, { status: "sent" });
  } catch (error) {
    return handleError(res, error);
  }
});

quizzesRouter.post("/:quizId/invitations/send-one", async (req, res) => {
  try {
    const userId = (req as any).user?.sub || "";
    await connectDb();
    await assertQuizOwnership(userId, req.params.quizId);
    await sendInvitationToStudent(req.params.quizId, req.body?.email);
    return ok(res, { status: "sent" });
  } catch (error) {
    return handleError(res, error);
  }
});

quizzesRouter.post("/:quizId/invitations/resend", async (req, res) => {
  try {
    const userId = (req as any).user?.sub || "";
    await connectDb();
    await assertQuizOwnership(userId, req.params.quizId);
    await resendInvitation(req.params.quizId, req.body?.email);
    return ok(res, { status: "sent" });
  } catch (error) {
    return handleError(res, error);
  }
});

quizzesRouter.get("/:quizId/attempts", async (req, res) => {
  try {
    const userId = (req as any).user?.sub || "";
    await connectDb();
    await assertQuizOwnership(userId, req.params.quizId);
    const attempts = await Attempt.find({ quizId: req.params.quizId }).lean();
    return ok(res, attempts);
  } catch (error) {
    return handleError(res, error);
  }
});

quizzesRouter.get("/:quizId/dashboard", async (req, res) => {
  try {
    const userId = (req as any).user?.sub || "";
    await connectDb();
    await assertQuizOwnership(userId, req.params.quizId);
    const attempts = await Attempt.find({ quizId: req.params.quizId }).lean();
    const quiz = await Quiz.findById(req.params.quizId).lean();
    const endAt = quiz?.settings?.endAt ? new Date(quiz.settings.endAt) : null;
    const now = new Date();
    const remainingSeconds = endAt ? Math.max(0, Math.floor((endAt.getTime() - now.getTime()) / 1000)) : null;
    const totalAttempts = attempts.length;
    const completed = attempts.filter((a) => a.status === "completed");
    const scores = completed.map((a) => a.score?.correctCount || 0);
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    return ok(res, {
      totalAttempts,
      activeAttempts: attempts.filter((a) => a.status === "in_progress").length,
      averageScore: avg,
      lastSubmissionAt: completed.sort((a, b) => (a.submittedAt || 0) < (b.submittedAt || 0) ? 1 : -1)[0]?.submittedAt || null,
      endAt,
      remainingSeconds,
      status: quiz?.status || "draft"
    });
  } catch (error) {
    return handleError(res, error);
  }
});

quizzesRouter.patch("/:quizId/terminate", async (req, res) => {
  try {
    const userId = (req as any).user?.sub || "";
    await connectDb();
    await assertQuizOwnership(userId, req.params.quizId);
    await Quiz.findByIdAndUpdate(req.params.quizId, { status: "closed" });
    await Attempt.updateMany(
      { quizId: req.params.quizId, status: "in_progress" },
      { $set: { status: "forcibly_ended", submittedAt: new Date() } }
    );
    await AuditLog.create({
      quizId: req.params.quizId,
      type: "quiz_closed",
      message: "Quiz closed by instructor"
    });
    return ok(res, { status: "closed" });
  } catch (error) {
    return handleError(res, error);
  }
});

quizzesRouter.patch("/:quizId/extend", async (req, res) => {
  try {
    const userId = (req as any).user?.sub || "";
    const minutes = Number(req.body?.minutes || 0);
    if (!minutes) {
      return ok(res, { error: "Minutes required" }, 400);
    }
    await connectDb();
    await assertQuizOwnership(userId, req.params.quizId);
    const quiz = await Quiz.findById(req.params.quizId).lean();
    if (!quiz) {
      return ok(res, { error: "Quiz not found" }, 404);
    }
    const base = quiz.settings.endAt ? new Date(quiz.settings.endAt) : new Date();
    const next = new Date(base.getTime() + minutes * 60 * 1000);
    await Quiz.updateOne({ _id: req.params.quizId }, { $set: { "settings.endAt": next } });
    return ok(res, { status: "extended", endAt: next });
  } catch (error) {
    return handleError(res, error);
  }
});

quizzesRouter.get("/:quizId/audit", async (req, res) => {
  try {
    const userId = (req as any).user?.sub || "";
    await connectDb();
    await assertQuizOwnership(userId, req.params.quizId);
    const logs = await AuditLog.find({ quizId: req.params.quizId }).sort({ createdAt: -1 }).lean();
    const attemptIds = logs
      .map((log) => (log.meta?.attemptId ? String(log.meta.attemptId) : ""))
      .filter((id) => Boolean(id));
    const attempts = await Attempt.find({ _id: { $in: attemptIds } }).lean();
    const attemptMap = new Map(attempts.map((a) => [a._id.toString(), a]));
    const rows = logs.map((log) => {
      const attemptId = log.meta?.attemptId ? String(log.meta.attemptId) : "";
      const attempt = attemptId ? attemptMap.get(attemptId) : null;
      return {
        id: log._id.toString(),
        type: log.type,
        message: log.message,
        timestamp: log.createdAt?.toISOString() || new Date().toISOString(),
        studentName: attempt?.studentName || null,
        studentEmail: log.meta?.email || null
      };
    });
    return ok(res, rows);
  } catch (error) {
    return handleError(res, error);
  }
});

quizzesRouter.get("/:quizId/export", async (req, res) => {
  try {
    const userId = (req as any).user?.sub || "";
    await connectDb();
    await assertQuizOwnership(userId, req.params.quizId);
    const csv = await exportAttemptsCsv(req.params.quizId);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=quiz-attempts.csv");
    return res.status(200).send(csv);
  } catch (error) {
    return handleError(res, error);
  }
});
