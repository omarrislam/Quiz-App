import { NextRequest } from "next/server";
import { connectDb } from "../../../../../server/db";
import { ok, handleError } from "../../../../../server/http/response";
import { Attempt } from "../../../../../server/models/Attempt";
import { Quiz } from "../../../../../server/models/Quiz";
import { AttemptSnapshot } from "../../../../../server/models/AttemptSnapshot";

type SnapshotPayload = {
  phase?: string;
  data?: string;
  mime?: string;
  width?: number;
  height?: number;
};

const MAX_BASE64_LENGTH = 800000;

export async function POST(request: NextRequest, { params }: { params: { attemptId: string } }) {
  try {
    const body = (await request.json()) as SnapshotPayload;
    const phase = body.phase;
    if (!phase || !["start", "middle", "end"].includes(phase)) {
      return ok({ error: "Invalid snapshot phase" }, 400);
    }
    if (!body.data || typeof body.data !== "string") {
      return ok({ error: "Missing snapshot data" }, 400);
    }
    if (!body.mime || typeof body.mime !== "string" || !body.mime.startsWith("image/")) {
      return ok({ error: "Invalid snapshot mime" }, 400);
    }
    const data = body.data.includes(",") ? body.data.split(",").pop() || "" : body.data;
    if (!data) {
      return ok({ error: "Empty snapshot data" }, 400);
    }
    if (data.length > MAX_BASE64_LENGTH) {
      return ok({ error: "Snapshot too large" }, 413);
    }
    await connectDb();
    const attempt = await Attempt.findById(params.attemptId).lean();
    if (!attempt) {
      return ok({ error: "Attempt not found" }, 404);
    }
    const quiz = await Quiz.findById(attempt.quizId).select("settings.enableWebcamSnapshots").lean();
    if (!quiz?.settings?.enableWebcamSnapshots) {
      return ok({ error: "Webcam snapshots disabled" }, 403);
    }
    const existing = await AttemptSnapshot.findOne({ attemptId: attempt._id, phase }).lean();
    if (existing) {
      return ok({ status: "exists" });
    }
    await AttemptSnapshot.create({
      attemptId: attempt._id,
      quizId: attempt.quizId,
      studentId: attempt.studentId || null,
      phase,
      mime: body.mime,
      data,
      width: Number(body.width) || 320,
      height: Number(body.height) || 240
    });
    return ok({ status: "saved" }, 201);
  } catch (error) {
    return handleError(error);
  }
}
