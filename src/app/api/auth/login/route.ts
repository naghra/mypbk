import { loginSchema } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/server";
import { ensureAppUser } from "@/lib/auth/ensure-user";
import { rateLimit } from "@/lib/security/rate-limit";
import { handleApiError, jsonError, jsonOk } from "@/lib/api/response";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") ?? "anon";
    const limited = await rateLimit({ key: `login:${ip}`, limit: 10, windowMs: 60_000 });
    if (!limited.success) return jsonError("Too many requests", 429);

    const body = loginSchema.parse(await request.json());
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });

    if (error) return jsonError(error.message, 401);
    if (!data.user) return jsonError("Invalid credentials", 401);

    const user = await ensureAppUser(data.user);
    if (user.isBanned) {
      await supabase.auth.signOut();
      return jsonError("Account suspended", 403);
    }

    return jsonOk({
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      role: user.role,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
