import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { handleApiError, jsonOk } from "@/lib/api/response";

const schema = z.object({ isVisible: z.boolean() });

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const body = schema.parse(await request.json());
    const profile = await prisma.profile.update({
      where: { userId: user.id },
      data: { isVisible: body.isVisible },
    });
    return jsonOk(profile);
  } catch (error) {
    return handleApiError(error);
  }
}
