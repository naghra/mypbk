import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { sendMessageSchema } from "@/lib/validations/messaging";
import { moderateText } from "@/lib/moderation/content";
import { handleApiError, jsonError, jsonOk } from "@/lib/api/response";
import { rateLimit } from "@/lib/security/rate-limit";

type Params = { params: Promise<{ matchId: string }> };

async function assertMatchParticipant(userId: string, matchId: string) {
  const match = await prisma.match.findFirst({
    where: {
      id: matchId,
      status: "MATCHED",
      OR: [{ user1Id: userId }, { user2Id: userId }],
    },
  });
  return match;
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const { matchId } = await params;
    const match = await assertMatchParticipant(user.id, matchId);
    if (!match) return jsonError("Match not found", 404);

    const messages = await prisma.message.findMany({
      where: {
        matchId,
        moderationStatus: { not: "BLOCKED" },
      },
      orderBy: { createdAt: "asc" },
      take: 200,
    });

    // Mark others' messages as read (read receipts for premium handled client-side)
    await prisma.message.updateMany({
      where: {
        matchId,
        senderId: { not: user.id },
        isRead: false,
      },
      data: { isRead: true, readAt: new Date() },
    });

    return jsonOk(messages);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const { matchId } = await params;
    const limited = await rateLimit({ key: `msg:${user.id}`, limit: 40, windowMs: 60_000 });
    if (!limited.success) return jsonError("Too many requests", 429);

    const match = await assertMatchParticipant(user.id, matchId);
    if (!match) return jsonError("Messaging requires mutual interest", 403);

    const body = sendMessageSchema.parse({
      ...(await request.json()),
      matchId,
    });

    // No image payloads in messages — text only (halal / respectful policy)
    const moderation = moderateText(body.content);
    if (!moderation.allowed) {
      await prisma.message.create({
        data: {
          matchId,
          senderId: user.id,
          content: body.content,
          moderationStatus: "BLOCKED",
          moderationFlags: moderation.flags,
        },
      });
      return jsonError("Message blocked by moderation", 422, { flags: moderation.flags });
    }

    const message = await prisma.message.create({
      data: {
        matchId,
        senderId: user.id,
        content: moderation.cleaned ?? body.content,
        moderationStatus: moderation.status,
        moderationFlags: moderation.flags,
      },
    });

    const recipientId = match.user1Id === user.id ? match.user2Id : match.user1Id;
    await prisma.notification.create({
      data: {
        userId: recipientId,
        type: "NEW_MESSAGE",
        title: "New message",
        body: "You received a new message",
        data: { matchId, messageId: message.id },
      },
    });

    await prisma.match.update({
      where: { id: matchId },
      data: { updatedAt: new Date() },
    });

    return jsonOk(message);
  } catch (error) {
    return handleApiError(error);
  }
}
