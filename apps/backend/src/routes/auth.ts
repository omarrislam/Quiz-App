import { Router } from "express";
import type { Request } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectDb } from "../server/db";
import { Instructor } from "../server/models/Instructor";
import { ApiError } from "../server/http/errors";
import { handleError, ok } from "../http/response";
import { requireAuth } from "../middleware/auth";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    if (!name || !email || !password) {
      throw new ApiError("Missing required fields", 400);
    }
    await connectDb();
    const existing = await Instructor.findOne({ email }).lean();
    if (existing) {
      throw new ApiError("Email already registered", 409);
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const instructor = await Instructor.create({ name, email, passwordHash, role: "instructor" });
    return ok(res, { id: instructor._id.toString(), email: instructor.email }, 201);
  } catch (error) {
    return handleError(res, error);
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    if (!email || !password) {
      throw new ApiError("Missing credentials", 400);
    }
    await connectDb();
    const user = await Instructor.findOne({ email }).lean();
    if (!user) {
      throw new ApiError("Invalid credentials", 401);
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new ApiError("Invalid credentials", 401);
    }
    const secret = process.env.JWT_SECRET || "";
    if (!secret) {
      throw new ApiError("JWT_SECRET is not set", 500);
    }
    const token = jwt.sign({ sub: user._id.toString(), email: user.email, role: user.role }, secret, { expiresIn: "7d" });
    return ok(res, { token, user: { id: user._id.toString(), email: user.email, name: user.name } });
  } catch (error) {
    return handleError(res, error);
  }
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = (req as Request & { user?: { sub: string; email: string; role?: string } }).user;
  return ok(res, { id: user?.sub || "", email: user?.email || "", role: user?.role || "" });
});
