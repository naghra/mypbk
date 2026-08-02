import { z } from "zod";

export const sendMessageSchema = z.object({
  matchId: z.string().uuid(),
  content: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(2000, "Message is too long"),
});

export const interestSchema = z.object({
  receiverId: z.string().uuid(),
  action: z.enum(["INTERESTED", "SKIPPED"]),
});

export const reportSchema = z.object({
  reportedId: z.string().uuid(),
  reason: z.enum([
    "INAPPROPRIATE_CONTENT",
    "HARASSMENT",
    "FAKE_PROFILE",
    "SPAM",
    "EXPLICIT_CONTENT",
    "OTHER",
  ]),
  description: z.string().max(2000).optional(),
});

export const blockSchema = z.object({
  blockedId: z.string().uuid(),
});
