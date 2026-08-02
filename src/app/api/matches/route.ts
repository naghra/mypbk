import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { interestSchema } from "@/lib/validations/messaging";
import { computeCompatibility } from "@/lib/matching/score";
import { getOrderedMatchPair, calculateAge } from "@/lib/utils";
import { handleApiError, jsonError, jsonOk } from "@/lib/api/response";
import { rateLimit } from "@/lib/security/rate-limit";

async function resetLikesIfNeeded(userId: string) {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub) return null;
  if (sub.tier === "PREMIUM") return sub;

  const dayMs = 24 * 60 * 60 * 1000;
  if (Date.now() - sub.likesResetAt.getTime() >= dayMs) {
    return prisma.subscription.update({
      where: { userId },
      data: {
        likesRemaining: Number(process.env.FREE_DAILY_LIKES ?? 10),
        likesResetAt: new Date(),
      },
    });
  }
  return sub;
}

export async function GET() {
  try {
    const user = await requireUser();
    const matches = await prisma.match.findMany({
      where: {
        status: "MATCHED",
        OR: [{ user1Id: user.id }, { user2Id: user.id }],
      },
      include: {
        user1: {
          include: {
            profile: true,
            photos: { where: { isPrimary: true }, take: 1 },
          },
        },
        user2: {
          include: {
            profile: true,
            photos: { where: { isPrimary: true }, take: 1 },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const data = matches.map((m) => {
      const other = m.user1Id === user.id ? m.user2 : m.user1;
      return {
        id: m.id,
        compatibilityScore: m.compatibilityScore,
        createdAt: m.createdAt,
        lastMessage: m.messages[0] ?? null,
        user: {
          id: other.id,
          nickname: other.profile?.nickname,
          age: other.profile ? calculateAge(other.profile.dateOfBirth) : null,
          city: other.profile?.city,
          isVerified: other.profile?.isVerified,
          photo: other.photos[0]?.url ?? null,
        },
      };
    });

    return jsonOk(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const limited = await rateLimit({ key: `interest:${user.id}`, limit: 60, windowMs: 60_000 });
    if (!limited.success) return jsonError("Too many requests", 429);

    const body = interestSchema.parse(await request.json());
    if (body.receiverId === user.id) return jsonError("Invalid target", 400);

    const blocked = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: user.id, blockedId: body.receiverId },
          { blockerId: body.receiverId, blockedId: user.id },
        ],
      },
    });
    if (blocked) return jsonError("Unavailable", 400);

    if (body.action === "INTERESTED") {
      const sub = await resetLikesIfNeeded(user.id);
      if (sub?.tier === "FREE" && sub.likesRemaining <= 0) {
        return jsonError("Daily interest limit reached. Upgrade to Premium.", 402);
      }
      if (sub?.tier === "FREE") {
        await prisma.subscription.update({
          where: { userId: user.id },
          data: { likesRemaining: { decrement: 1 } },
        });
      }
    }

    const interest = await prisma.interest.upsert({
      where: {
        senderId_receiverId: { senderId: user.id, receiverId: body.receiverId },
      },
      create: {
        senderId: user.id,
        receiverId: body.receiverId,
        action: body.action,
      },
      update: { action: body.action },
    });

    let match = null;
    if (body.action === "INTERESTED") {
      const reciprocal = await prisma.interest.findUnique({
        where: {
          senderId_receiverId: {
            senderId: body.receiverId,
            receiverId: user.id,
          },
        },
      });

      if (reciprocal?.action === "INTERESTED") {
        const [user1Id, user2Id] = getOrderedMatchPair(user.id, body.receiverId);
        const [p1, p2, prefs] = await Promise.all([
          prisma.profile.findUnique({ where: { userId: user.id } }),
          prisma.profile.findUnique({ where: { userId: body.receiverId } }),
          prisma.preference.findUnique({ where: { userId: user.id } }),
        ]);
        const score =
          p1 && p2 ? computeCompatibility(p1, p2, prefs).total : null;

        match = await prisma.match.upsert({
          where: { user1Id_user2Id: { user1Id, user2Id } },
          create: {
            user1Id,
            user2Id,
            status: "MATCHED",
            compatibilityScore: score ?? undefined,
          },
          update: {
            status: "MATCHED",
            compatibilityScore: score ?? undefined,
          },
        });

        await prisma.notification.createMany({
          data: [
            {
              userId: user.id,
              type: "NEW_MATCH",
              title: "New match",
              body: "Interest is mutual. You may begin a respectful conversation.",
              data: { matchId: match.id },
            },
            {
              userId: body.receiverId,
              type: "NEW_MATCH",
              title: "New match",
              body: "Interest is mutual. You may begin a respectful conversation.",
              data: { matchId: match.id },
            },
          ],
        });
      } else {
        await prisma.notification.create({
          data: {
            userId: body.receiverId,
            type: "NEW_LIKE",
            title: "Someone is interested",
            body: "A member expressed interest in your profile.",
            data: { fromUserId: user.id },
          },
        });
      }
    }

    return jsonOk({ interest, match });
  } catch (error) {
    return handleApiError(error);
  }
}
