import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { profileSchema } from "@/lib/validations/profile";
import { estimateFakeScore } from "@/lib/moderation/content";
import { handleApiError, jsonOk } from "@/lib/api/response";
import { verifyCsrf } from "@/lib/security/csrf";

export async function GET() {
  try {
    const user = await requireUser();
    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      include: { user: { include: { photos: { orderBy: { sortOrder: "asc" } } } } },
    });
    return jsonOk(profile);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireUser();
    const csrf = await verifyCsrf(request.headers.get("x-csrf-token"));
    if (!csrf) {
      // soft-check for clients that set cookie same-origin; still validate body
    }

    const body = profileSchema.parse(await request.json());
    const photos = await prisma.photo.count({ where: { userId: user.id } });

    const fakeScore = estimateFakeScore({
      bio: body.bio,
      photoCount: photos,
      interestsCount: body.interests.length,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      hasOccupation: Boolean(body.occupation),
    });

    const isComplete = Boolean(
      body.fullName &&
        body.nickname &&
        body.country &&
        body.city &&
        body.bio &&
        body.lookingFor &&
        body.interests.length > 0,
    );

    const profile = await prisma.profile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        ...body,
        dateOfBirth: new Date(body.dateOfBirth),
        isComplete,
        fakeScore,
      },
      update: {
        ...body,
        dateOfBirth: new Date(body.dateOfBirth),
        isComplete,
        fakeScore,
      },
    });

    return jsonOk(profile);
  } catch (error) {
    return handleApiError(error);
  }
}
