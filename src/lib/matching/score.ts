import type { Preference, Profile } from "@prisma/client";
import { calculateAge, haversineKm } from "@/lib/utils";

export type CompatibilityBreakdown = {
  total: number;
  religious: number;
  interests: number;
  lifestyle: number;
  personality: number;
  education: number;
  age: number;
};

function overlapScore(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 50;
  const setB = new Set(b.map((x) => x.toLowerCase()));
  const hits = a.filter((x) => setB.has(x.toLowerCase())).length;
  return Math.round((hits / Math.max(a.length, b.length)) * 100);
}

function religiousScore(a: Profile, b: Profile): number {
  const order = [
    "PRACTICING",
    "MODERATELY_PRACTICING",
    "SEEKING_TO_IMPROVE",
    "CULTURAL",
  ] as const;
  const prayerOrder = [
    "FIVE_TIMES",
    "MOST_PRAYERS",
    "FRIDAY_ONLY",
    "OCCASIONALLY",
    "RARELY",
  ] as const;
  const commitDiff = Math.abs(
    order.indexOf(a.religiousCommitment) - order.indexOf(b.religiousCommitment),
  );
  const prayerDiff = Math.abs(
    prayerOrder.indexOf(a.prayerFrequency) - prayerOrder.indexOf(b.prayerFrequency),
  );
  const commit = Math.max(0, 100 - commitDiff * 25);
  const prayer = Math.max(0, 100 - prayerDiff * 20);
  const smokingPenalty =
    a.smoking === "NEVER" && b.smoking === "REGULARLY"
      ? 30
      : a.smoking !== b.smoking
        ? 10
        : 0;
  return Math.max(0, Math.round((commit + prayer) / 2 - smokingPenalty));
}

function ageScore(age: number, prefs: Preference | null): number {
  if (!prefs) return 70;
  if (age >= prefs.minAge && age <= prefs.maxAge) return 100;
  const distance = age < prefs.minAge ? prefs.minAge - age : age - prefs.maxAge;
  return Math.max(0, 100 - distance * 15);
}

function educationScore(a: Profile, b: Profile, prefs: Preference | null): number {
  if (!a.education || !b.education) return 60;
  if (prefs?.educationLevels?.length && !prefs.educationLevels.includes(b.education)) {
    return 20;
  }
  return a.education === b.education ? 100 : 70;
}

export function computeCompatibility(
  viewer: Profile,
  candidate: Profile,
  viewerPrefs: Preference | null,
): CompatibilityBreakdown {
  const age = calculateAge(candidate.dateOfBirth);
  const religious = religiousScore(viewer, candidate);
  const interests = overlapScore(viewer.interests, candidate.interests);
  const lifestyle = overlapScore(viewer.lifestyleTags, candidate.lifestyleTags);
  const personality = overlapScore(viewer.personalityTraits, candidate.personalityTraits);
  const education = educationScore(viewer, candidate, viewerPrefs);
  const ageCompat = ageScore(age, viewerPrefs);

  const total = Math.round(
    religious * 0.3 +
      interests * 0.2 +
      lifestyle * 0.15 +
      personality * 0.15 +
      education * 0.1 +
      ageCompat * 0.1,
  );

  return {
    total,
    religious,
    interests,
    lifestyle,
    personality,
    education,
    age: ageCompat,
  };
}

export function passesHardFilters(
  viewer: Profile,
  candidate: Profile,
  prefs: Preference | null,
): boolean {
  if (viewer.gender === candidate.gender) return false;
  if (!candidate.isVisible || !candidate.isComplete) return false;

  const age = calculateAge(candidate.dateOfBirth);
  if (prefs) {
    if (age < prefs.minAge || age > prefs.maxAge) return false;
    if (prefs.countries.length && !prefs.countries.includes(candidate.country)) return false;
    if (prefs.cities.length && !prefs.cities.includes(candidate.city)) return false;
    if (
      prefs.educationLevels.length &&
      candidate.education &&
      !prefs.educationLevels.includes(candidate.education)
    ) {
      return false;
    }
    if (
      prefs.maritalStatuses.length &&
      !prefs.maritalStatuses.includes(candidate.maritalStatus)
    ) {
      return false;
    }
    if (
      prefs.religiousCommitments.length &&
      !prefs.religiousCommitments.includes(candidate.religiousCommitment)
    ) {
      return false;
    }
    if (prefs.acceptChildren === false && candidate.hasChildren) return false;
    if (
      prefs.minHeightCm &&
      candidate.heightCm &&
      candidate.heightCm < prefs.minHeightCm
    ) {
      return false;
    }
    if (
      prefs.maxHeightCm &&
      candidate.heightCm &&
      candidate.heightCm > prefs.maxHeightCm
    ) {
      return false;
    }
    if (
      prefs.languages.length &&
      !candidate.languages.some((l) => prefs.languages.includes(l))
    ) {
      return false;
    }
    if (
      prefs.professions.length &&
      candidate.occupation &&
      !prefs.professions.some((p) =>
        candidate.occupation!.toLowerCase().includes(p.toLowerCase()),
      )
    ) {
      return false;
    }
    if (
      prefs.maxDistanceKm &&
      viewer.latitude != null &&
      viewer.longitude != null &&
      candidate.latitude != null &&
      candidate.longitude != null
    ) {
      const km = haversineKm(
        viewer.latitude,
        viewer.longitude,
        candidate.latitude,
        candidate.longitude,
      );
      if (km > prefs.maxDistanceKm) return false;
    }
  }
  return true;
}
