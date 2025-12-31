import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { connectDb } from "../../../../server/db";
import { Instructor } from "../../../../server/models/Instructor";
import { ApiError } from "../../../../server/http/errors";
import { ok, handleError } from "../../../../server/http/response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!name || !email || !password) {
      throw new ApiError("Missing required fields", 400);
    }
    if (!email.endsWith("@mans.edu.eg")) {
      throw new ApiError("Only @mans.edu.eg emails are allowed", 400);
    }

    await connectDb();
    const existing = await Instructor.findOne({ email }).lean();
    if (existing) {
      throw new ApiError("Email already registered", 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const instructor = await Instructor.create({ name, email, passwordHash, role: "instructor" });
    return ok({ id: instructor._id.toString(), email: instructor.email }, 201);
  } catch (error) {
    return handleError(error);
  }
}
