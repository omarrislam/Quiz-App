import mongoose, { Model, Schema, model, Types } from "mongoose";
import { baseSchemaOptions } from "./base";

export interface QuizSettings {
  questionTimeSeconds: number;
  totalTimeSeconds?: number | null;
  startAt?: Date | null;
  endAt?: Date | null;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  requireFullscreen: boolean;
  logSuspiciousActivity: boolean;
  enableWebcamSnapshots: boolean;
  enableFaceCentering: boolean;
  allowMultipleAttempts: boolean;
  showScoreToStudent: boolean;
  mobileAllowed: boolean;
  requireStudentListMatch: boolean;
}

export interface QuizDocument {
  instructorId: Types.ObjectId;
  title: string;
  description?: string;
  quizCode?: string;
  settings: QuizSettings;
  status: "draft" | "published" | "closed";
  createdAt?: Date;
  updatedAt?: Date;
}

const QuizSchema = new Schema<QuizDocument>(
  {
    instructorId: { type: Schema.Types.ObjectId, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String },
    quizCode: { type: String, index: true },
    settings: {
      questionTimeSeconds: { type: Number, default: 35 },
      totalTimeSeconds: { type: Number, default: null },
      startAt: { type: Date, default: null },
      endAt: { type: Date, default: null },
      shuffleQuestions: { type: Boolean, default: true },
      shuffleOptions: { type: Boolean, default: true },
      requireFullscreen: { type: Boolean, default: false },
      logSuspiciousActivity: { type: Boolean, default: true },
      enableWebcamSnapshots: { type: Boolean, default: false },
      enableFaceCentering: { type: Boolean, default: false },
      allowMultipleAttempts: { type: Boolean, default: false },
      showScoreToStudent: { type: Boolean, default: false },
      mobileAllowed: { type: Boolean, default: true },
      requireStudentListMatch: { type: Boolean, default: false }
    },
    status: { type: String, enum: ["draft", "published", "closed"], default: "draft" }
  },
  baseSchemaOptions
);

const QuizModel = (mongoose.models.Quiz as Model<QuizDocument>) || model<QuizDocument>("Quiz", QuizSchema);

export const Quiz = QuizModel;


