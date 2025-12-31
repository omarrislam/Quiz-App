import { Schema, model, models, Types } from "mongoose";
import { baseSchemaOptions } from "./base";

export interface EventDocument {
  quizId: Types.ObjectId;
  attemptId: Types.ObjectId;
  type: string;
  message?: string;
  timestamp: Date;
  extra?: Record<string, unknown>;
}

const EventSchema = new Schema<EventDocument>(
  {
    quizId: { type: Schema.Types.ObjectId, required: true, index: true },
    attemptId: { type: Schema.Types.ObjectId, required: true, index: true },
    type: { type: String, required: true },
    message: { type: String },
    timestamp: { type: Date, required: true },
    extra: { type: Object, default: {} }
  },
  baseSchemaOptions
);

export const Event = models.Event || model<EventDocument>("Event", EventSchema);
