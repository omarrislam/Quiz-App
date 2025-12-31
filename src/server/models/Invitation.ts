import { Model, Schema, model, models, Types } from "mongoose";
import { baseSchemaOptions } from "./base";

export interface InvitationDocument {
  quizId: Types.ObjectId;
  studentId: Types.ObjectId;
  email: string;
  otpCodeHash: string;
  otpExpiresAt: Date;
  lastOtpSentAt?: Date | null;
  maxOtpAttempts: number;
  otpAttempts?: number;
  verifiedAt?: Date | null;
  createdAt?: Date;
}

const InvitationSchema = new Schema<InvitationDocument>(
  {
    quizId: { type: Schema.Types.ObjectId, required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, required: true, index: true },
    email: { type: String, required: true },
    otpCodeHash: { type: String, required: true },
    otpExpiresAt: { type: Date, required: true },
    lastOtpSentAt: { type: Date, default: null },
    maxOtpAttempts: { type: Number, default: 5 },
    otpAttempts: { type: Number, default: 0 },
    verifiedAt: { type: Date, default: null }
  },
  baseSchemaOptions
);

const InvitationModel = (models.Invitation as Model<InvitationDocument>) || model<InvitationDocument>("Invitation", InvitationSchema);

export const Invitation = InvitationModel;


