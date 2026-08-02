import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { handleApiError, jsonError, jsonOk } from "@/lib/api/response";
import { computeCompatibility } from "@/lib/matching/score";
import { calculateAge } from "@/lib/utils";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const blocked = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: user.id, blockedId: id },
          { blockerId: id, blockedId: user.id },
        ],
      },
    });
    if (blocked) return jsonError("Profile unavailable", 404);

    const profile = await prisma.profile.findUnique({
      where: { userId: id },
      include: {
        user: {
          select: {
            id: true,
            lastActiveAt: true,
            photos: {
              where: { isApproved: true },
              orderBy: { sortOrder: "asc" },
            },
          },
        },
      },
    });

    if (!profile || !profile.isVisible || !profile.isComplete) {
      return jsonError("Profile not found", 404);
    }

    const viewer = await prisma.profile.findUnique({ where: { userId: user.id } });
    const prefs = await prisma.preference.findUnique({ where: { userId: user.id } });
    const compatibility = viewer
      ? computeCompatibility(viewer, profile, prefs)
      : null;

    return jsonOk({
      id: profile.userId,
      nickname: profile.nickname,
      age: calculateAge(profile.dateOfBirth),
      gender: profile.gender,
      country: profile.country,
      city: profile.city,
      nationality: profile.nationality,
      heightCm: profile.heightCm,
      education: profile.education,
      occupation: profile.occupation,
      maritalStatus: profile.maritalStatus,
      hasChildren: profile.hasChildren,
      languages: profile.languages,
      religiousCommitment: profile.religiousCommitment,
      prayerFrequency: profile.prayerFrequency,
      smoking: profile.smoking,
      bio: profile.bio,
      interests: profile.interests,
      lookingFor: profile.lookingFor,
      isVerified: profile.isVerified,
      personalityTraits: profile.personalityTraits,
      lifestyleTags: profile.lifestyleTags,
      photos: profile.user.photos,
      compatibility,
      // Privacy: never expose full legal name or income to other users
    });
  } catch (error) {
    return handleApiError(error);
  }
}
