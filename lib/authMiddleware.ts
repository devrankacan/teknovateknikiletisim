import { NextRequest } from "next/server";
import { verifyToken } from "./jwt";

export async function requireAuth(req: NextRequest): Promise<Record<string, unknown> | null> {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return null;
  return verifyToken(token);
}
