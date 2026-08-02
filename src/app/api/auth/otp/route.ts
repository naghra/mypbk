import { phoneOtpSchema, verifyOtpSchema } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/server";
import { ensureAppUser } from "@/lib/auth/ensure-user";
import { rateLimit } from "@/lib/security/rate-limit";
import { handleApiError, jsonError, jsonOk } from "@/lib/api/response";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const ip = request.headers.get("x-forwarded-for") ?? "anon";

    if (payload.token) {
      const body = verifyOtpSchema.parse(payload);
      const limited = await rateLimit({ key: `otp-verify:${ip}`, limit: 10, windowMs: 60_000 });
      if (!limited.success) return jsonError("Too many requests", 429);

      const supabase = await createClient();
      const { data, error } = await supabase.auth.verifyOtp({
        phone: body.phone,
        token: body.token,
        type: "sms",
      });
      if (error) return jsonError(error.message, 400);
      if (!data.user) return jsonError("Invalid OTP", 400);

      const user = await ensureAppUser(data.user);
      return jsonOk({ id: user.id, phoneVerified: true });
    }

    const body = phoneOtpSchema.parse(payload);
    const limited = await rateLimit({ key: `otp-send:${ip}`, limit: 5, windowMs: 60_000 });
    if (!limited.success) return jsonError("Too many requests", 429);

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({ phone: body.phone });
    if (error) return jsonError(error.message, 400);
    return jsonOk({ sent: true });
  } catch (error) {
    return handleApiError(error);
  }
}
