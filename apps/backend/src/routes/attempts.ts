import { Router } from "express";
import { connectDb } from "../server/db";
import { handleError, ok } from "../http/response";
import { recordEvent, finishAttempt } from "../server/attempts/attemptService";
import { Attempt } from "../server/models/Attempt";
import { Event } from "../server/models/Event";
import { Question } from "../server/models/Question";
import { AttemptSnapshot } from "../server/models/AttemptSnapshot";
import { SecondCamSnapshot } from "../server/models/SecondCamSnapshot";
import { SecondCamSession } from "../server/models/SecondCamSession";
import { Quiz } from "../server/models/Quiz";
import { requireAuth } from "../middleware/auth";
import { assertQuizOwnership } from "../server/quizzes/quizService";
import { AuditLog } from "../server/models/AuditLog";
import jwt from "jsonwebtoken";

export const attemptsRouter = Router();

function verifySecondCamToken(token: string, attemptId: string) {
  if (!token) return false;
  const secret = process.env.JWT_SECRET || "";
  if (!secret) return false;
  try {
    const payload = jwt.verify(token, secret) as { sub?: string; type?: string };
    if (payload?.type !== "second_cam") return false;
    return payload?.sub === attemptId;
  } catch {
    return false;
  }
}

// Public routes for students
attemptsRouter.get("/:attemptId/status", async (req, res) => {
  try {
    await connectDb();
    const attempt = await Attempt.findById(req.params.attemptId).lean();
    if (!attempt) {
      return ok(res, { error: "Attempt not found" }, 404);
    }
    return ok(res, { status: attempt.status });
  } catch (error) {
    return handleError(res, error);
  }
});

attemptsRouter.post("/:attemptId/events", async (req, res) => {
  try {
    await connectDb();
    await recordEvent(req.params.attemptId, req.body?.type, req.body?.message, req.body?.extra);
    return ok(res, { status: "logged" });
  } catch (error) {
    return handleError(res, error);
  }
});

attemptsRouter.post("/:attemptId/finish", async (req, res) => {
  try {
    await connectDb();
    const result = await finishAttempt(req.params.attemptId, req.body?.answers || []);
    await SecondCamSession.deleteMany({ attemptId: req.params.attemptId });
    return ok(res, result);
  } catch (error) {
    return handleError(res, error);
  }
});

attemptsRouter.post("/:attemptId/snapshots", async (req, res) => {
  try {
    await connectDb();
    const attempt = await Attempt.findById(req.params.attemptId).lean();
    if (!attempt) {
      return ok(res, { error: "Attempt not found" }, 404);
    }
    const quiz = await Quiz.findById(attempt.quizId)
      .select("settings.enableWebcamSnapshots settings.enableFaceCentering")
      .lean();
    const snapshotsEnabled = Boolean(quiz?.settings?.enableWebcamSnapshots || quiz?.settings?.enableFaceCentering);
    if (!snapshotsEnabled) {
      console.warn("snapshot_rejected", { attemptId: attempt._id.toString(), reason: "disabled" });
      return ok(res, { error: "Webcam snapshots disabled" }, 403);
    }
    const phase = req.body?.phase;
    if (!phase || !["start", "middle", "end"].includes(phase)) {
      console.warn("snapshot_rejected", { attemptId: attempt._id.toString(), reason: "invalid_phase", phase });
      return ok(res, { error: "Invalid snapshot phase" }, 400);
    }
    const data = typeof req.body?.data === "string" ? req.body.data : "";
    const mime = typeof req.body?.mime === "string" ? req.body.mime : "";
    if (!data || !mime.startsWith("image/")) {
      console.warn("snapshot_rejected", {
        attemptId: attempt._id.toString(),
        reason: "invalid_data",
        hasData: Boolean(data),
        mime
      });
      return ok(res, { error: "Invalid snapshot data" }, 400);
    }
    const existing = await AttemptSnapshot.findOne({ attemptId: attempt._id, phase }).lean();
    if (existing) {
      return ok(res, { status: "exists" });
    }
    await AttemptSnapshot.create({
      attemptId: attempt._id,
      quizId: attempt.quizId,
      studentId: attempt.studentId || null,
      phase,
      mime,
      data,
      width: Number(req.body?.width) || 320,
      height: Number(req.body?.height) || 240
    });
    return ok(res, { status: "saved" }, 201);
  } catch (error) {
    return handleError(res, error);
  }
});

attemptsRouter.post("/:attemptId/second-cam/connect", async (req, res) => {
  try {
    await connectDb();
    const attempt = await Attempt.findById(req.params.attemptId).lean();
    if (!attempt) {
      return ok(res, { error: "Attempt not found" }, 404);
    }
    if (attempt.status !== "in_progress") {
      return ok(res, { error: "Attempt not active" }, 403);
    }
    const quiz = await Quiz.findById(attempt.quizId).select("settings.enableSecondCam").lean();
    if (!quiz?.settings?.enableSecondCam) {
      return ok(res, { error: "Second camera disabled" }, 403);
    }
    const token = typeof req.body?.token === "string" ? req.body.token : "";
    if (!verifySecondCamToken(token, attempt._id.toString())) {
      return ok(res, { error: "Invalid token" }, 401);
    }
    const now = new Date();
    await SecondCamSession.updateOne(
      { attemptId: attempt._id },
      {
        $setOnInsert: {
          attemptId: attempt._id,
          quizId: attempt.quizId,
          studentId: attempt.studentId || null,
          connectedAt: now
        },
        $set: { lastSeenAt: now }
      },
      { upsert: true }
    );
    return ok(res, { status: "connected" });
  } catch (error) {
    return handleError(res, error);
  }
});

attemptsRouter.get("/:attemptId/second-cam/status", async (req, res) => {
  try {
    await connectDb();
    const attempt = await Attempt.findById(req.params.attemptId).lean();
    if (!attempt) {
      return ok(res, { error: "Attempt not found" }, 404);
    }
    if (attempt.status !== "in_progress") {
      return ok(res, { error: "Attempt not active" }, 403);
    }
    const quiz = await Quiz.findById(attempt.quizId).select("settings.enableSecondCam").lean();
    if (!quiz?.settings?.enableSecondCam) {
      return ok(res, { connected: false });
    }
    const session = await SecondCamSession.findOne({ attemptId: attempt._id }).lean();
    const lastSeen = session?.lastSeenAt ? new Date(session.lastSeenAt) : null;
    const connected = Boolean(lastSeen && (Date.now() - lastSeen.getTime()) < 20000);
    return ok(res, { connected });
  } catch (error) {
    return handleError(res, error);
  }
});

attemptsRouter.post("/:attemptId/second-cam/snapshots", async (req, res) => {
  try {
    await connectDb();
    const attempt = await Attempt.findById(req.params.attemptId).lean();
    if (!attempt) {
      return ok(res, { error: "Attempt not found" }, 404);
    }
    const quiz = await Quiz.findById(attempt.quizId).select("settings.enableSecondCam").lean();
    if (!quiz?.settings?.enableSecondCam) {
      return ok(res, { error: "Second camera disabled" }, 403);
    }
    const token = typeof req.body?.token === "string" ? req.body.token : "";
    if (!verifySecondCamToken(token, attempt._id.toString())) {
      return ok(res, { error: "Invalid token" }, 401);
    }
    const data = typeof req.body?.data === "string" ? req.body.data : "";
    const mime = typeof req.body?.mime === "string" ? req.body.mime : "";
    if (!data || !mime.startsWith("image/")) {
      return ok(res, { error: "Invalid snapshot data" }, 400);
    }
    const now = new Date();
    await SecondCamSession.updateOne(
      { attemptId: attempt._id },
      {
        $setOnInsert: {
          attemptId: attempt._id,
          quizId: attempt.quizId,
          studentId: attempt.studentId || null,
          connectedAt: now
        },
        $set: { lastSeenAt: now }
      },
      { upsert: true }
    );
    await SecondCamSnapshot.create({
      attemptId: attempt._id,
      quizId: attempt.quizId,
      studentId: attempt.studentId || null,
      mime,
      data,
      width: Number(req.body?.width) || 320,
      height: Number(req.body?.height) || 240
    });
    return ok(res, { status: "saved" }, 201);
  } catch (error) {
    return handleError(res, error);
  }
});

// Instructor-protected routes
attemptsRouter.use(requireAuth);

attemptsRouter.get("/:attemptId/detail", async (req, res) => {
  try {
    const userId = (req as any).user?.sub || "";
    await connectDb();
    const attempt = await Attempt.findById(req.params.attemptId).lean();
    if (!attempt) {
      return ok(res, { error: "Attempt not found" }, 404);
    }
    await assertQuizOwnership(userId, attempt.quizId.toString());
    const questions = await Question.find({ quizId: attempt.quizId }).lean();
    const map = new Map(questions.map((q) => [q._id.toString(), q]));
    const details = attempt.score?.details || [];
    const answers = details.map((detail) => {
      const q = map.get(detail.questionId.toString());
      const selectedByText = detail.selectedOption && q?.options
        ? q.options.indexOf(detail.selectedOption)
        : -1;
      return {
        question: q?.text || "Unknown question",
        options: q?.options || [],
        selectedIndex: selectedByText >= 0 ? selectedByText : detail.selectedIndex,
        correctIndex: q?.correctIndex ?? null
      };
    });
    const snapshots = await AttemptSnapshot.find({ attemptId: attempt._id })
      .sort({ createdAt: 1 })
      .lean();
    const secondCamSnapshots = await SecondCamSnapshot.find({ attemptId: attempt._id })
      .sort({ createdAt: 1 })
      .lean();
    return ok(res, {
      studentName: attempt.studentName,
      studentEmail: attempt.studentEmail,
      status: attempt.status,
      score: attempt.score,
      answers,
      snapshots: snapshots.map((snapshot) => ({
        phase: snapshot.phase,
        mime: snapshot.mime,
        data: snapshot.data,
        createdAt: snapshot.createdAt
      })),
      secondCamSnapshots: secondCamSnapshots.map((snapshot) => ({
        mime: snapshot.mime,
        data: snapshot.data,
        createdAt: snapshot.createdAt
      }))
    });
  } catch (error) {
    return handleError(res, error);
  }
});

attemptsRouter.patch("/:attemptId/terminate", async (req, res) => {
  try {
    const userId = (req as any).user?.sub || "";
    await connectDb();
    const attempt = await Attempt.findById(req.params.attemptId).lean();
    if (!attempt) {
      return ok(res, { error: "Attempt not found" }, 404);
    }
    await assertQuizOwnership(userId, attempt.quizId.toString());
    await Attempt.updateOne(
      { _id: req.params.attemptId },
      { $set: { status: "forcibly_ended", submittedAt: new Date() } }
    );
    await AuditLog.create({
      quizId: attempt.quizId,
      type: "attempt_ended",
      message: `Attempt ended for ${attempt.studentEmail}`,
      meta: { attemptId: attempt._id.toString(), email: attempt.studentEmail }
    });
    return ok(res, { status: "ended" });
  } catch (error) {
    return handleError(res, error);
  }
});

attemptsRouter.delete("/:attemptId", async (req, res) => {
  try {
    const userId = (req as any).user?.sub || "";
    await connectDb();
    const attempt = await Attempt.findById(req.params.attemptId).lean();
    if (!attempt) {
      return ok(res, { error: "Attempt not found" }, 404);
    }
    await assertQuizOwnership(userId, attempt.quizId.toString());
    await Promise.all([
      Attempt.deleteOne({ _id: req.params.attemptId }),
      Event.deleteMany({ attemptId: req.params.attemptId }),
      AttemptSnapshot.deleteMany({ attemptId: req.params.attemptId }),
      SecondCamSnapshot.deleteMany({ attemptId: req.params.attemptId }),
      SecondCamSession.deleteMany({ attemptId: req.params.attemptId })
    ]);
    await AuditLog.create({
      quizId: attempt.quizId,
      type: "attempt_removed",
      message: `Attempt removed for ${attempt.studentEmail}`,
      meta: { attemptId: attempt._id.toString(), email: attempt.studentEmail }
    });
    return ok(res, { status: "deleted" });
  } catch (error) {
    return handleError(res, error);
  }
});
