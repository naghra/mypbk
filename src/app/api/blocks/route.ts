import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { blockSchema } from "@/lib/validations/messaging";
import { handleApiError, jsonError, jsonOk } from "@/lib/api/response";

export async function GET() {
  try {
    const user = await requireUser();
    const blocks = await prisma.block.findMany({
      where: { blockerId: user.id },
      include: {
        blocked: {
          select: {
            id: true,
            profile: { select: { nickname: true } },
          },
        },
      },
    });
    return jsonOk(blocks);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = blockSchema.parse(await request.json());
    if (body.blockedId === user.id) return jsonError("Invalid", 400);

    const block = await prisma.block.upsert({
      where: {
        blockerId_blockedId: { blockerId: user.id, blockedId: body.blockedId },
      },
      create: { blockerId: user.id, blockedId: body.blockedId },
      update: {},
    });

    // Unmatch if exists
    await prisma.match.updateMany({
      where: {
        status: "MATCHED",
        OR: [
          { user1Id: user.id, user2Id: body.blockedId },
          { user1Id: body.blockedId, user2Id: user.id },
        ],
      },
      data: { status: "UNMATCHED", unmatchedById: user.id },
    });

    return jsonOk(block);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const blockedId = searchParams.get("blockedId");
    if (!blockedId) return jsonError("blockedId required", 400);
    await prisma.block.deleteMany({ where: { blockerId: user.id, blockedId } });
    return jsonOk({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
