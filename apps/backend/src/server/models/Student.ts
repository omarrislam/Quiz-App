import mongoose, { Model, Schema, model, Types } from "mongoose";
import { baseSchemaOptions } from "./base";

export interface StudentDocument {
  quizId: Types.ObjectId;
  name: string;
  email: string;
  externalId?: string | null;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
}

const StudentSchema = new Schema<StudentDocument>(
  {
    quizId: { type: Schema.Types.ObjectId, required: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    externalId: { type: String, default: null },
    metadata: { type: Object, default: {} }
  },
  baseSchemaOptions
);

const StudentModel = (mongoose.models.Student as Model<StudentDocument>) || model<StudentDocument>("Student", StudentSchema);

export const Student = StudentModel;


