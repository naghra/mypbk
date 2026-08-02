import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { estimatePhotoFakeScore } from "@/lib/moderation/content";
import { handleApiError, jsonError, jsonOk } from "@/lib/api/response";
import { z } from "zod";

const typeSchema = z.enum(["GOVERNMENT_ID", "SELFIE"]);

export async function GET() {
  try {
    const user = await requireUser();
    const items = await prisma.verification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return jsonOk(items);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const form = await request.formData();
    const type = typeSchema.parse(form.get("type"));
    const file = form.get("file");
    if (!(file instanceof File)) return jsonError("File required", 400);

    const pending = await prisma.verification.findFirst({
      where: { userId: user.id, type, status: "PENDING" },
    });
    if (pending) return jsonError("Verification already pending", 400);

    const aiFakeScore = estimatePhotoFakeScore({
      fileSize: file.size,
      mimeType: file.type,
    });

    const ext = file.type.split("/")[1] ?? "jpg";
    const path = `${user.supabaseAuthId ?? user.id}/${type.toLowerCase()}-${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const admin = createAdminClient();
    const { error } = await admin.storage.from("verification-docs").upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });
    if (error) return jsonError(error.message, 400);

    const { data } = await admin.storage
      .from("verification-docs")
      .createSignedUrl(path, 60 * 60 * 24 * 7);

    const verification = await prisma.verification.create({
      data: {
        userId: user.id,
        type,
        status: aiFakeScore > 0.8 ? "REJECTED" : "PENDING",
        documentUrl: type === "GOVERNMENT_ID" ? data?.signedUrl : null,
        selfieUrl: type === "SELFIE" ? data?.signedUrl : null,
        aiFakeScore,
        reviewerNotes: aiFakeScore > 0.8 ? "Auto-rejected by AI fake detection" : null,
      },
    });

    // Auto-approve low risk for demo when both types approved
    if (aiFakeScore < 0.25) {
      await prisma.verification.update({
        where: { id: verification.id },
        data: { status: "APPROVED", reviewedAt: new Date(), reviewerNotes: "Auto-approved" },
      });
      const approved = await prisma.verification.count({
        where: { userId: user.id, status: "APPROVED" },
      });
      if (approved >= 2) {
        await prisma.profile.updateMany({
          where: { userId: user.id },
          data: { isVerified: true },
        });
      }
    }

    return jsonOk(verification);
  } catch (error) {
    return handleApiError(error);
  }
}
