import jwt from "jsonwebtoken";

// 🔹 Generate a temporary token (valid for 15 minutes)
export function generateTempToken(userId: string, refreshToken?: string) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }
  return jwt.sign({ userId, refreshToken }, process.env.JWT_SECRET!, {
    expiresIn: "15m",
  });
}
