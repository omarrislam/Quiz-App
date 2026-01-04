import mongoose, { Model, Schema, model, Types } from "mongoose";
import { baseSchemaOptions } from "./base";

export interface AuditLogDocument {
  quizId: Types.ObjectId;
  type: string;
  message: string;
  meta?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

const AuditLogSchema = new Schema<AuditLogDocument>(
  {
    quizId: { type: Schema.Types.ObjectId, required: true, index: true },
    type: { type: String, required: true },
    message: { type: String, required: true },
    meta: { type: Object, default: {} }
  },
  baseSchemaOptions
);

const AuditLogModel = (mongoose.models.AuditLog as Model<AuditLogDocument>) || model<AuditLogDocument>("AuditLog", AuditLogSchema);

export const AuditLog = AuditLogModel;


