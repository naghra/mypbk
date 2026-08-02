import { registerSchema } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/server";
import { ensureAppUser } from "@/lib/auth/ensure-user";
import { rateLimit } from "@/lib/security/rate-limit";
import { handleApiError, jsonCreated, jsonError } from "@/lib/api/response";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") ?? "anon";
    const limited = await rateLimit({ key: `register:${ip}`, limit: 5, windowMs: 60_000 });
    if (!limited.success) return jsonError("Too many requests", 429);

    const body = registerSchema.parse(await request.json());
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        data: { full_name: body.fullName, locale: body.locale },
      },
    });

    if (error) return jsonError(error.message, 400);
    if (!data.user) return jsonError("Unable to create account", 400);

    const user = await ensureAppUser(data.user, {
      fullName: body.fullName,
      locale: body.locale,
    });

    return jsonCreated({
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      requiresEmailVerification: !user.emailVerified,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
