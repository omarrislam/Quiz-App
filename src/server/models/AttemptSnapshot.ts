import { Schema, model, models, Types } from "mongoose";
import { baseSchemaOptions } from "./base";

export type SnapshotPhase = "start" | "middle" | "end";

export interface AttemptSnapshotDocument {
  attemptId: Types.ObjectId;
  quizId: Types.ObjectId;
  studentId?: Types.ObjectId | null;
  phase: SnapshotPhase;
  mime: string;
  data: string;
  width: number;
  height: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const AttemptSnapshotSchema = new Schema<AttemptSnapshotDocument>(
  {
    attemptId: { type: Schema.Types.ObjectId, required: true, index: true },
    quizId: { type: Schema.Types.ObjectId, required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, default: null, index: true },
    phase: { type: String, enum: ["start", "middle", "end"], required: true },
    mime: { type: String, required: true },
    data: { type: String, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true }
  },
  baseSchemaOptions
);

AttemptSnapshotSchema.index({ attemptId: 1, phase: 1 }, { unique: true });
AttemptSnapshotSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 5 });

export const AttemptSnapshot = models.AttemptSnapshot || model<AttemptSnapshotDocument>("AttemptSnapshot", AttemptSnapshotSchema);
