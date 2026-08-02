import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE = "mithaq-csrf";

function sign(token: string) {
  const secret = process.env.CSRF_SECRET ?? "dev-csrf";
  return createHash("sha256").update(`${token}.${secret}`).digest("hex");
}

export async function ensureCsrfToken(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(COOKIE)?.value;
  if (existing) return existing.split(".")[0]!;

  const token = randomBytes(24).toString("hex");
  const value = `${token}.${sign(token)}`;
  jar.set(COOKIE, value, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  return token;
}

export async function verifyCsrf(headerToken: string | null): Promise<boolean> {
  if (!headerToken) return false;
  const jar = await cookies();
  const cookie = jar.get(COOKIE)?.value;
  if (!cookie) return false;
  const [token, sig] = cookie.split(".");
  if (!token || !sig) return false;
  const expected = sign(token);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
    return timingSafeEqual(Buffer.from(token), Buffer.from(headerToken));
  } catch {
    return false;
  }
}
