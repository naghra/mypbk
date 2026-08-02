import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { handleApiError, jsonError, jsonOk } from "@/lib/api/response";
import { calculateAge } from "@/lib/utils";

/** Premium: see who liked you */
export async function GET() {
  try {
    const user = await requireUser();
    const subscription = await prisma.subscription.findUnique({ where: { userId: user.id } });
    if (subscription?.tier !== "PREMIUM") {
      return jsonError("Premium required to see who liked you", 402);
    }

    const acted = await prisma.interest.findMany({
      where: { senderId: user.id },
      select: { receiverId: true },
    });
    const actedSet = new Set(acted.map((a) => a.receiverId));

    const likes = await prisma.interest.findMany({
      where: {
        receiverId: user.id,
        action: "INTERESTED",
      },
      include: {
        sender: {
          include: {
            profile: true,
            photos: { where: { isPrimary: true }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const data = likes
      .filter((l) => !actedSet.has(l.senderId))
      .map((l) => ({
        id: l.senderId,
        nickname: l.sender.profile?.nickname,
        age: l.sender.profile ? calculateAge(l.sender.profile.dateOfBirth) : null,
        city: l.sender.profile?.city,
        isVerified: l.sender.profile?.isVerified,
        photo: l.sender.photos[0]?.url ?? null,
        createdAt: l.createdAt,
      }));

    return jsonOk(data);
  } catch (error) {
    return handleApiError(error);
  }
}
