import { Model, Schema, model, models, Types } from "mongoose";
import { baseSchemaOptions } from "./base";

export interface QuestionDocument {
  quizId: Types.ObjectId;
  text: string;
  options: string[];
  correctIndex: number;
  order: number;
  metadata?: { difficulty?: string | null; tags?: string[] };
}

const QuestionSchema = new Schema<QuestionDocument>(
  {
    quizId: { type: Schema.Types.ObjectId, required: true, index: true },
    text: { type: String, required: true },
    options: { type: [String], required: true },
    correctIndex: { type: Number, required: true },
    order: { type: Number, required: true },
    metadata: {
      difficulty: { type: String, default: null },
      tags: { type: [String], default: [] }
    }
  },
  baseSchemaOptions
);

const QuestionModel = (models.Question as Model<QuestionDocument>) || model<QuestionDocument>("Question", QuestionSchema);

export const Question = QuestionModel;

