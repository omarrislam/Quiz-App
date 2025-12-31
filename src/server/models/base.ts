import { SchemaOptions } from "mongoose";

export const baseSchemaOptions: SchemaOptions<any> = {
  timestamps: true,
  versionKey: false
};
