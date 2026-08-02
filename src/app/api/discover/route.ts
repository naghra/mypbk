import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { computeCompatibility, passesHardFilters } from "@/lib/matching/score";
import { handleApiError, jsonError, jsonOk } from "@/lib/api/response";
import { calculateAge } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? 10), 20);

    const viewer = await prisma.profile.findUnique({ where: { userId: user.id } });
    if (!viewer || !viewer.isComplete) {
      return jsonError("Complete your profile to discover matches", 400);
    }

    const prefs = await prisma.preference.findUnique({ where: { userId: user.id } });

    const [acted, blocked] = await Promise.all([
      prisma.interest.findMany({
        where: { senderId: user.id },
        select: { receiverId: true },
      }),
      prisma.block.findMany({
        where: {
          OR: [{ blockerId: user.id }, { blockedId: user.id }],
        },
      }),
    ]);

    const excludeIds = new Set<string>([
      user.id,
      ...acted.map((a) => a.receiverId),
      ...blocked.map((b) => (b.blockerId === user.id ? b.blockedId : b.blockerId)),
    ]);

    const candidates = await prisma.profile.findMany({
      where: {
        isComplete: true,
        isVisible: true,
        gender: viewer.gender === "MALE" ? "FEMALE" : "MALE",
        userId: { notIn: [...excludeIds] },
        user: { isActive: true, isBanned: false, emailVerified: true },
      },
      include: {
        user: {
          select: {
            photos: {
              where: { OR: [{ isApproved: true }, { userId: user.id }] },
              orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
              take: 3,
            },
          },
        },
      },
      take: 80,
      orderBy: [{ isPriority: "desc" }, { updatedAt: "desc" }],
    });

    const scored = candidates
      .filter((c) => passesHardFilters(viewer, c, prefs))
      .map((c) => {
        const compatibility = computeCompatibility(viewer, c, prefs);
        return {
          id: c.userId,
          nickname: c.nickname,
          age: calculateAge(c.dateOfBirth),
          city: c.city,
          country: c.country,
          occupation: c.occupation,
          bio: c.bio,
          interests: c.interests,
          religiousCommitment: c.religiousCommitment,
          prayerFrequency: c.prayerFrequency,
          isVerified: c.isVerified,
          photos: c.user.photos,
          compatibility,
        };
      })
      .sort((a, b) => b.compatibility.total - a.compatibility.total)
      .slice(0, limit);

    const subscription = await prisma.subscription.findUnique({ where: { userId: user.id } });

    return jsonOk({
      profiles: scored,
      likesRemaining: subscription?.tier === "PREMIUM" ? null : subscription?.likesRemaining ?? 0,
      tier: subscription?.tier ?? "FREE",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
