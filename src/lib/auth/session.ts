import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import type { Role, User } from "@prisma/client";

export type SessionUser = User & {
  profile: { id: string; nickname: string; isComplete: boolean; isVerified: boolean; gender: "MALE" | "FEMALE" } | null;
  subscription: { tier: "FREE" | "PREMIUM"; likesRemaining: number; status: string } | null;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ supabaseAuthId: authUser.id }, { email: authUser.email ?? undefined }],
    },
    include: {
      profile: {
        select: {
          id: true,
          nickname: true,
          isComplete: true,
          isVerified: true,
          gender: true,
        },
      },
      subscription: {
        select: { tier: true, likesRemaining: true, status: true },
      },
    },
  });

  if (!user || user.isBanned || !user.isActive) return null;
  return user;
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AuthError("Unauthorized", 401);
  if (!user.emailVerified) throw new AuthError("Email verification required", 403);
  return user;
}

export async function requireAdmin(roles: Role[] = ["ADMIN", "MODERATOR"]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) throw new AuthError("Forbidden", 403);
  return user;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}
