import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { searchSchema } from "@/lib/validations/profile";
import { computeCompatibility, passesHardFilters } from "@/lib/matching/score";
import { handleApiError, jsonError, jsonOk } from "@/lib/api/response";
import { calculateAge } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = searchSchema.parse(await request.json());

    const subscription = await prisma.subscription.findUnique({ where: { userId: user.id } });
    const isPremium = subscription?.tier === "PREMIUM";

    // Advanced filters require premium
    const usingAdvanced =
      body.educationLevels.length > 0 ||
      body.religiousCommitments.length > 0 ||
      body.minHeightCm != null ||
      body.maxHeightCm != null ||
      body.professions.length > 0;

    if (usingAdvanced && !isPremium) {
      return jsonError("Advanced filters require Premium", 402);
    }

    const viewer = await prisma.profile.findUnique({ where: { userId: user.id } });
    if (!viewer) return jsonError("Profile required", 400);

    const blocked = await prisma.block.findMany({
      where: { OR: [{ blockerId: user.id }, { blockedId: user.id }] },
    });
    const exclude = new Set([
      user.id,
      ...blocked.map((b) => (b.blockerId === user.id ? b.blockedId : b.blockerId)),
    ]);

    const profiles = await prisma.profile.findMany({
      where: {
        isComplete: true,
        isVisible: true,
        gender: viewer.gender === "MALE" ? "FEMALE" : "MALE",
        userId: { notIn: [...exclude] },
        ...(body.countries.length ? { country: { in: body.countries } } : {}),
        ...(body.cities.length ? { city: { in: body.cities } } : {}),
        ...(body.maritalStatuses.length ? { maritalStatus: { in: body.maritalStatuses } } : {}),
        user: { isActive: true, isBanned: false },
      },
      include: {
        user: {
          select: {
            photos: { where: { isApproved: true, isPrimary: true }, take: 1 },
          },
        },
      },
      take: 100,
    });

    const prefs = {
      id: "search",
      userId: user.id,
      minAge: body.minAge,
      maxAge: body.maxAge,
      maxDistanceKm: body.maxDistanceKm,
      countries: body.countries,
      cities: body.cities,
      educationLevels: body.educationLevels,
      maritalStatuses: body.maritalStatuses,
      religiousCommitments: body.religiousCommitments,
      acceptChildren: body.acceptChildren ?? null,
      languages: body.languages,
      minHeightCm: body.minHeightCm ?? null,
      maxHeightCm: body.maxHeightCm ?? null,
      professions: body.professions,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const results = profiles
      .filter((p) => passesHardFilters(viewer, p, prefs))
      .filter((p) => {
        if (!body.query) return true;
        const q = body.query.toLowerCase();
        return (
          p.nickname.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q) ||
          p.occupation?.toLowerCase().includes(q) ||
          p.bio?.toLowerCase().includes(q)
        );
      })
      .map((p) => ({
        id: p.userId,
        nickname: p.nickname,
        age: calculateAge(p.dateOfBirth),
        city: p.city,
        country: p.country,
        occupation: p.occupation,
        education: p.education,
        religiousCommitment: p.religiousCommitment,
        isVerified: p.isVerified,
        photo: p.user.photos[0]?.url ?? null,
        compatibility: computeCompatibility(viewer, p, prefs),
      }))
      .sort((a, b) => b.compatibility.total - a.compatibility.total);

    const start = (body.page - 1) * body.limit;
    return jsonOk({
      total: results.length,
      page: body.page,
      results: results.slice(start, start + body.limit),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
