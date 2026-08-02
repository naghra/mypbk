export type ModerationResult = {
  allowed: boolean;
  status: "APPROVED" | "FLAGGED" | "BLOCKED";
  flags: string[];
  cleaned?: string;
};

const EXPLICIT_PATTERNS = [
  /\b(nude|naked|sex|porn|xxx|hookup|one\s*night|netflix\s*and\s*chill)\b/i,
  /\b(صورة\s*عارية|جنس|سكس|دعارة|خادعة)\b/i,
];

const SPAM_PATTERNS = [
  /(https?:\/\/|www\.)\S+/i,
  /\b(whatsapp|telegram|instagram|snapchat|onlyfans)\b/i,
  /\b(واتساب|تلجرام|انستغرام|سناب)\b/i,
  /(.)\1{6,}/,
];

const HARASSMENT_PATTERNS = [
  /\b(kill yourself|idiot|stupid|hate you)\b/i,
  /\b(اقتل نفسك|غبي|أحمق)\b/i,
];

const CONTACT_PATTERNS = [
  /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/,
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
];

export function moderateText(content: string): ModerationResult {
  const flags: string[] = [];
  const text = content.trim();

  if (!text) {
    return { allowed: false, status: "BLOCKED", flags: ["empty"] };
  }

  for (const pattern of EXPLICIT_PATTERNS) {
    if (pattern.test(text)) flags.push("explicit_content");
  }
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(text)) flags.push("spam_or_offplatform");
  }
  for (const pattern of HARASSMENT_PATTERNS) {
    if (pattern.test(text)) flags.push("harassment");
  }
  for (const pattern of CONTACT_PATTERNS) {
    if (pattern.test(text)) flags.push("contact_sharing");
  }

  const unique = [...new Set(flags)];

  if (unique.includes("explicit_content") || unique.includes("harassment")) {
    return { allowed: false, status: "BLOCKED", flags: unique };
  }
  if (unique.length) {
    return { allowed: true, status: "FLAGGED", flags: unique, cleaned: text };
  }
  return { allowed: true, status: "APPROVED", flags: [], cleaned: text };
}

/** Heuristic fake-account score 0–1 (higher = more suspicious). */
export function estimateFakeScore(input: {
  bio?: string | null;
  photoCount: number;
  interestsCount: number;
  emailVerified: boolean;
  phoneVerified: boolean;
  hasOccupation: boolean;
}): number {
  let score = 0.35;
  if (!input.bio || input.bio.length < 40) score += 0.15;
  if (input.photoCount === 0) score += 0.25;
  if (input.photoCount === 1) score += 0.1;
  if (input.interestsCount < 2) score += 0.1;
  if (!input.emailVerified) score += 0.15;
  if (!input.phoneVerified) score += 0.05;
  if (!input.hasOccupation) score += 0.05;
  return Math.min(1, Math.max(0, Number(score.toFixed(2))));
}

/** Simple AI fake photo heuristic placeholder — replace with vision model in production. */
export function estimatePhotoFakeScore(meta: {
  fileSize: number;
  width?: number;
  height?: number;
  mimeType: string;
}): number {
  let score = 0.1;
  if (meta.fileSize < 20_000) score += 0.35;
  if (meta.width && meta.height && meta.width < 200) score += 0.25;
  if (!["image/jpeg", "image/png", "image/webp"].includes(meta.mimeType)) {
    score += 0.4;
  }
  return Math.min(1, Number(score.toFixed(2)));
}
