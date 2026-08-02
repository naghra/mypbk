import { describe, expect, it } from "vitest";
import { computeCompatibility } from "./score";
import type { Preference, Profile } from "@prisma/client";

function profile(partial: Partial<Profile>): Profile {
  return {
    id: "1",
    userId: "u1",
    fullName: "A",
    nickname: "A",
    gender: "MALE",
    dateOfBirth: new Date("1995-01-01"),
    country: "SA",
    city: "Riyadh",
    nationality: "SA",
    heightCm: 175,
    weightKg: 70,
    education: "BACHELOR",
    occupation: "Engineer",
    income: null,
    maritalStatus: "SINGLE",
    hasChildren: false,
    childrenCount: 0,
    languages: ["ar", "en"],
    religiousCommitment: "PRACTICING",
    prayerFrequency: "FIVE_TIMES",
    smoking: "NEVER",
    bio: "bio",
    interests: ["quran", "travel"],
    lookingFor: "marriage",
    isVerified: false,
    isComplete: true,
    isVisible: true,
    isPriority: false,
    personalityTraits: ["kind"],
    lifestyleTags: ["active"],
    latitude: null,
    longitude: null,
    fakeScore: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...partial,
  };
}

describe("computeCompatibility", () => {
  it("scores aligned practicing profiles highly", () => {
    const a = profile({ userId: "a", gender: "MALE" });
    const b = profile({
      userId: "b",
      gender: "FEMALE",
      interests: ["quran", "travel", "family"],
      personalityTraits: ["kind"],
      lifestyleTags: ["active"],
    });
    const score = computeCompatibility(a, b, null as unknown as Preference | null);
    expect(score.total).toBeGreaterThan(70);
    expect(score.religious).toBeGreaterThan(80);
  });
});
