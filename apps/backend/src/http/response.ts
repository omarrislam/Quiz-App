import type { Response } from "express";
import { ApiError } from "../server/http/errors";

export function ok<T>(res: Response, data: T, status = 200) {
  return res.status(status).json(data);
}

export function handleError(res: Response, error: unknown) {
  if (error instanceof ApiError) {
    return res.status(error.status).json({ error: error.message, details: error.details });
  }
  console.error("Unhandled error:", error);
  return res.status(500).json({ error: "Internal server error" });
}
