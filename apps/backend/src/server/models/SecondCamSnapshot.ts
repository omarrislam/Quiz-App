import mongoose, { Model, Schema, model, Types } from "mongoose";
import { baseSchemaOptions } from "./base";

export interface SecondCamSnapshotDocument {
  attemptId: Types.ObjectId;
  quizId: Types.ObjectId;
  studentId?: Types.ObjectId | null;
  mime: string;
  data: string;
  width: number;
  height: number;
  createdAt?: Date;
}

const SecondCamSnapshotSchema = new Schema<SecondCamSnapshotDocument>(
  {
    attemptId: { type: Schema.Types.ObjectId, required: true, index: true },
    quizId: { type: Schema.Types.ObjectId, required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, default: null },
    mime: { type: String, required: true },
    data: { type: String, required: true },
    width: { type: Number, default: 320 },
    height: { type: Number, default: 240 }
  },
  baseSchemaOptions
);

SecondCamSnapshotSchema.index({ attemptId: 1, createdAt: 1 });
SecondCamSnapshotSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 5 });

const SecondCamSnapshotModel = (mongoose.models.SecondCamSnapshot as Model<SecondCamSnapshotDocument>)
  || model<SecondCamSnapshotDocument>("SecondCamSnapshot", SecondCamSnapshotSchema);

export const SecondCamSnapshot = SecondCamSnapshotModel;
