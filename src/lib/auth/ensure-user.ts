import { prisma } from "@/lib/prisma";
import type { User as AuthUser } from "@supabase/supabase-js";

/** Upsert local user row after Supabase Auth success. */
export async function ensureAppUser(authUser: AuthUser, extras?: { fullName?: string; locale?: string }) {
  const email = authUser.email;
  if (!email) throw new Error("Email is required");

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ supabaseAuthId: authUser.id }, { email }],
    },
  });

  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        supabaseAuthId: authUser.id,
        emailVerified: Boolean(authUser.email_confirmed_at) || existing.emailVerified,
        phone: authUser.phone || existing.phone,
        phoneVerified: Boolean(authUser.phone) || existing.phoneVerified,
        lastActiveAt: new Date(),
      },
    });
  }

  return prisma.user.create({
    data: {
      email,
      supabaseAuthId: authUser.id,
      emailVerified: Boolean(authUser.email_confirmed_at),
      phone: authUser.phone,
      phoneVerified: Boolean(authUser.phone),
      locale: extras?.locale ?? "en",
      lastActiveAt: new Date(),
      subscription: {
        create: {
          tier: "FREE",
          likesRemaining: Number(process.env.FREE_DAILY_LIKES ?? 10),
          likesResetAt: new Date(),
        },
      },
      preferences: {
        create: {},
      },
    },
  });
}
