import { Schema, model, models } from "mongoose";
import { baseSchemaOptions } from "./base";

export type InstructorRole = "instructor" | "admin";

export interface InstructorDocument {
  name: string;
  email: string;
  passwordHash: string;
  role: InstructorRole;
  createdAt?: Date;
  updatedAt?: Date;
}

const InstructorSchema = new Schema<InstructorDocument>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["instructor", "admin"], default: "instructor" }
  },
  baseSchemaOptions
);

export const Instructor = models.Instructor || model<InstructorDocument>("Instructor", InstructorSchema);
