import { Invitation } from "../models/Invitation";
import { Student } from "../models/Student";
import { generateOtp, hashOtp } from "../security/otp";
import { rateLimit } from "../security/rateLimit";
import { getMailerConfigError, mailer } from "../mail/mailer";
import { ApiError } from "../http/errors";
import { AuditLog } from "../models/AuditLog";

const APP_BASE_URL = process.env.APP_BASE_URL || "";
const SMTP_FROM = process.env.SMTP_FROM || "";
const DEV_EMAIL_MODE = process.env.DEV_EMAIL_MODE === "true";

export async function sendInvitations(quizId: string) {
  const students = await Student.find({ quizId }).lean();
  if (students.length === 0) {
    throw new ApiError("No students found", 400);
  }
  if (!SMTP_FROM && !DEV_EMAIL_MODE) {
    throw new ApiError("SMTP_FROM is not set", 500);
  }
  if (!DEV_EMAIL_MODE) {
    const mailerError = getMailerConfigError();
    if (mailerError) {
      throw new ApiError(mailerError, 500);
    }
    if (!APP_BASE_URL) {
      throw new ApiError("APP_BASE_URL is not set", 500);
    }
  }

  const now = new Date();
  const otpExpiresAt = new Date(now.getTime() + 15 * 60 * 1000);

  for (const student of students) {
    const otp = generateOtp();
    const otpCodeHash = hashOtp(otp);
    const invite = await Invitation.findOneAndUpdate(
      { quizId, studentId: student._id },
      {
        $set: {
          email: student.email,
          otpCodeHash,
          otpExpiresAt,
          lastOtpSentAt: now,
          verifiedAt: null
        },
        $setOnInsert: { maxOtpAttempts: 5 }
      },
      { upsert: true, new: true }
    );

    const link = `${APP_BASE_URL}/q/${quizId}?email=${encodeURIComponent(student.email)}&name=${encodeURIComponent(student.name)}`;
    if (DEV_EMAIL_MODE) {
      console.info(`[dev-email] ${student.email} ${link} OTP=${otp}`);
    } else {
      await mailer.sendMail({
        from: SMTP_FROM,
        to: student.email,
        subject: "Quiz access code",
        text: [
          `Hello ${student.name},`,
          "",
          `Quiz link: ${link}`,
          `OTP: ${otp}`,
          "Expires in 15 minutes.",
          "",
          "If you did not request this, please ignore this email."
        ].join("\n")
      });
    }
    await AuditLog.create({
      quizId,
      type: "otp_sent",
      message: `OTP sent to ${student.email}`,
      meta: { email: student.email }
    });
  }
}

export async function resendInvitation(quizId: string, email: string) {
  const rateKey = `otp-resend:${quizId}:${email}`;
  if (!rateLimit(rateKey, 3, 10 * 60 * 1000)) {
    throw new ApiError("OTP resend rate limit exceeded", 429);
  }
  const student = await Student.findOne({ quizId, email }).lean();
  if (!student) {
    throw new ApiError("Student not found", 404);
  }
  if (!SMTP_FROM && !DEV_EMAIL_MODE) {
    throw new ApiError("SMTP_FROM is not set", 500);
  }
  if (!DEV_EMAIL_MODE) {
    const mailerError = getMailerConfigError();
    if (mailerError) {
      throw new ApiError(mailerError, 500);
    }
    if (!APP_BASE_URL) {
      throw new ApiError("APP_BASE_URL is not set", 500);
    }
  }
  const otp = generateOtp();
  const otpCodeHash = hashOtp(otp);
  const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await Invitation.findOneAndUpdate(
    { quizId, studentId: student._id },
    {
      $set: {
        email: student.email,
        otpCodeHash,
        otpExpiresAt,
        lastOtpSentAt: new Date(),
        verifiedAt: null
      },
      $setOnInsert: { maxOtpAttempts: 5 }
    },
    { upsert: true, new: true }
  );

  const link = `${APP_BASE_URL}/q/${quizId}?email=${encodeURIComponent(student.email)}&name=${encodeURIComponent(student.name)}`;
  if (DEV_EMAIL_MODE) {
    console.info(`[dev-email] ${student.email} ${link} OTP=${otp}`);
  } else {
    await mailer.sendMail({
      from: SMTP_FROM,
      to: student.email,
      subject: "Quiz access code",
      text: [
        `Hello ${student.name},`,
        "",
        `Quiz link: ${link}`,
        `OTP: ${otp}`,
        "Expires in 15 minutes.",
        "",
        "If you did not request this, please ignore this email."
      ].join("\n")
    });
  }
  await AuditLog.create({
    quizId,
    type: "otp_resend",
    message: `OTP resent to ${student.email}`,
    meta: { email: student.email }
  });
}

export async function sendInvitationToStudent(quizId: string, email: string) {
  const student = await Student.findOne({ quizId, email }).lean();
  if (!student) {
    throw new ApiError("Student not found", 404);
  }
  if (!SMTP_FROM && !DEV_EMAIL_MODE) {
    throw new ApiError("SMTP_FROM is not set", 500);
  }
  if (!DEV_EMAIL_MODE) {
    const mailerError = getMailerConfigError();
    if (mailerError) {
      throw new ApiError(mailerError, 500);
    }
    if (!APP_BASE_URL) {
      throw new ApiError("APP_BASE_URL is not set", 500);
    }
  }
  const otp = generateOtp();
  const otpCodeHash = hashOtp(otp);
  const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await Invitation.findOneAndUpdate(
    { quizId, studentId: student._id },
    {
      $set: {
        email: student.email,
        otpCodeHash,
        otpExpiresAt,
        lastOtpSentAt: new Date(),
        verifiedAt: null
      },
      $setOnInsert: { maxOtpAttempts: 5 }
    },
    { upsert: true, new: true }
  );

  const link = `${APP_BASE_URL}/q/${quizId}?email=${encodeURIComponent(student.email)}&name=${encodeURIComponent(student.name)}`;
  if (DEV_EMAIL_MODE) {
    console.info(`[dev-email] ${student.email} ${link} OTP=${otp}`);
  } else {
    await mailer.sendMail({
      from: SMTP_FROM,
      to: student.email,
      subject: "Quiz access code",
      text: [
        `Hello ${student.name},`,
        "",
        `Quiz link: ${link}`,
        `OTP: ${otp}`,
        "Expires in 15 minutes.",
        "",
        "If you did not request this, please ignore this email."
      ].join("\n")
    });
  }
  await AuditLog.create({
    quizId,
    type: "otp_sent",
    message: `OTP sent to ${student.email}`,
    meta: { email: student.email }
  });
}
