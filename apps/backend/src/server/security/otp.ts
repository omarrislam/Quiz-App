import crypto from "crypto";

export function generateOtp(digits = 6): string {
  const max = 10 ** digits;
  const value = crypto.randomInt(0, max);
  return value.toString().padStart(digits, "0");
}

export function hashOtp(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

export function verifyOtp(hash: string, otp: string): boolean {
  const provided = hashOtp(otp);
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(provided));
}
