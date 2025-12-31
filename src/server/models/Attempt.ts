import { Schema, model, models, Types } from "mongoose";
import { baseSchemaOptions } from "./base";

export interface AnswerDetail {
  questionId: Types.ObjectId;
  selectedIndex: number | null;
  isCorrect: boolean;
}

export interface AttemptDocument {
  quizId: Types.ObjectId;
  studentId?: Types.ObjectId | null;
  inviteId?: Types.ObjectId | null;
  studentName: string;
  studentEmail: string;
  startedAt: Date;
  submittedAt?: Date | null;
  status: "in_progress" | "completed" | "forcibly_ended" | "expired";
  score: {
    correctCount: number;
    totalQuestions: number;
    details: AnswerDetail[];
  };
  flags: {
    suspiciousEventsCount: number;
    forciblyEndedReason?: string | null;
  };
  clientInfo?: {
    userAgent?: string;
    ip?: string | null;
    deviceType?: "desktop" | "mobile" | "tablet";
  };
}

const AttemptSchema = new Schema<AttemptDocument>(
  {
    quizId: { type: Schema.Types.ObjectId, required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, default: null },
    inviteId: { type: Schema.Types.ObjectId, default: null },
    studentName: { type: String, required: true },
    studentEmail: { type: String, required: true },
    startedAt: { type: Date, required: true },
    submittedAt: { type: Date, default: null },
    status: { type: String, enum: ["in_progress", "completed", "forcibly_ended", "expired"], default: "in_progress" },
    score: {
      correctCount: { type: Number, default: 0 },
      totalQuestions: { type: Number, default: 0 },
      details: { type: [Object], default: [] }
    },
    flags: {
      suspiciousEventsCount: { type: Number, default: 0 },
      forciblyEndedReason: { type: String, default: null }
    },
    clientInfo: {
      userAgent: { type: String },
      ip: { type: String, default: null },
      deviceType: { type: String, default: "desktop" }
    }
  },
  baseSchemaOptions
);

export const Attempt = models.Attempt || model<AttemptDocument>("Attempt", AttemptSchema);
