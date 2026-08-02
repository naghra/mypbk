import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);

  // Persist locale preference from cookie / Accept-Language
  const locale =
    request.cookies.get("mithaq-locale")?.value ||
    (request.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en");

  if (!request.cookies.get("mithaq-locale")) {
    response.cookies.set("mithaq-locale", locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  response.headers.set("x-locale", locale);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
