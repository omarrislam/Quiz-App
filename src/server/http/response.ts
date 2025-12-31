import { NextResponse } from "next/server";
import { ApiError } from "./errors";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function handleError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message, details: error.details }, { status: error.status });
  }
  console.error("Unhandled error:", error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
