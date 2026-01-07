import mongoose, { Model, Schema, model, Types } from "mongoose";
import { baseSchemaOptions } from "./base";

export interface SecondCamSessionDocument {
  attemptId: Types.ObjectId;
  quizId: Types.ObjectId;
  studentId?: Types.ObjectId | null;
  connectedAt: Date;
  lastSeenAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const SecondCamSessionSchema = new Schema<SecondCamSessionDocument>(
  {
    attemptId: { type: Schema.Types.ObjectId, required: true, index: true, unique: true },
    quizId: { type: Schema.Types.ObjectId, required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, default: null },
    connectedAt: { type: Date, required: true },
    lastSeenAt: { type: Date, required: true }
  },
  baseSchemaOptions
);

SecondCamSessionSchema.index({ lastSeenAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 });

const SecondCamSessionModel = (mongoose.models.SecondCamSession as Model<SecondCamSessionDocument>)
  || model<SecondCamSessionDocument>("SecondCamSession", SecondCamSessionSchema);

export const SecondCamSession = SecondCamSessionModel;
