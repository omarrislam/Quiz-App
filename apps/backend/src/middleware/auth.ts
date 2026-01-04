import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

type TokenPayload = { sub: string; email: string; role?: string };

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const secret = process.env.JWT_SECRET || "";
  if (!secret) {
    return res.status(500).json({ error: "JWT_SECRET is not set" });
  }
  try {
    const decoded = jwt.verify(token, secret) as TokenPayload;
    (req as Request & { user?: TokenPayload }).user = decoded;
    return next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}
