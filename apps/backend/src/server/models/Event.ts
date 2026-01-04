import mongoose, { Model, Schema, model, Types } from "mongoose";
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

const EventModel = (mongoose.models.Event as Model<EventDocument>) || model<EventDocument>("Event", EventSchema);

export const Event = EventModel;


