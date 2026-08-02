import { z } from "zod";

export const genderEnum = z.enum(["MALE", "FEMALE"]);
export const maritalEnum = z.enum(["SINGLE", "DIVORCED", "WIDOWED"]);
export const religiousEnum = z.enum([
  "PRACTICING",
  "MODERATELY_PRACTICING",
  "SEEKING_TO_IMPROVE",
  "CULTURAL",
]);
export const prayerEnum = z.enum([
  "FIVE_TIMES",
  "MOST_PRAYERS",
  "FRIDAY_ONLY",
  "OCCASIONALLY",
  "RARELY",
]);
export const smokingEnum = z.enum(["NEVER", "OCCASIONALLY", "REGULARLY", "QUIT"]);
export const educationEnum = z.enum([
  "HIGH_SCHOOL",
  "DIPLOMA",
  "BACHELOR",
  "MASTER",
  "DOCTORATE",
  "OTHER",
]);

export const profileSchema = z.object({
  fullName: z.string().min(2).max(80),
  nickname: z.string().min(2).max(40),
  gender: genderEnum,
  dateOfBirth: z.string().refine((v) => {
    const d = new Date(v);
    const age = (Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000);
    return age >= 18 && age <= 100;
  }, "You must be at least 18"),
  country: z.string().min(2).max(80),
  city: z.string().min(2).max(80),
  nationality: z.string().min(2).max(80),
  heightCm: z.coerce.number().int().min(120).max(230).optional().nullable(),
  weightKg: z.coerce.number().int().min(35).max(250).optional().nullable(),
  education: educationEnum.optional().nullable(),
  occupation: z.string().max(100).optional().nullable(),
  income: z.string().max(80).optional().nullable(),
  maritalStatus: maritalEnum,
  hasChildren: z.boolean(),
  childrenCount: z.coerce.number().int().min(0).max(20),
  languages: z.array(z.string()).min(1).max(10),
  religiousCommitment: religiousEnum,
  prayerFrequency: prayerEnum,
  smoking: smokingEnum,
  bio: z.string().max(1000).optional().nullable(),
  interests: z.array(z.string()).max(20),
  lookingFor: z.string().max(1000).optional().nullable(),
  personalityTraits: z.array(z.string()).max(15),
  lifestyleTags: z.array(z.string()).max(15),
});

export const preferenceBaseSchema = z.object({
  minAge: z.coerce.number().int().min(18).max(100),
  maxAge: z.coerce.number().int().min(18).max(100),
  maxDistanceKm: z.coerce.number().int().min(1).max(20000),
  countries: z.array(z.string()),
  cities: z.array(z.string()),
  educationLevels: z.array(educationEnum),
  maritalStatuses: z.array(maritalEnum),
  religiousCommitments: z.array(religiousEnum),
  acceptChildren: z.boolean().optional().nullable(),
  languages: z.array(z.string()),
  minHeightCm: z.coerce.number().int().min(120).max(230).optional().nullable(),
  maxHeightCm: z.coerce.number().int().min(120).max(230).optional().nullable(),
  professions: z.array(z.string()),
});

export const preferenceSchema = preferenceBaseSchema.refine((d) => d.minAge <= d.maxAge, {
  message: "Minimum age must be less than or equal to maximum age",
  path: ["maxAge"],
});

export const searchSchema = preferenceBaseSchema
  .extend({
    query: z.string().max(100).optional(),
    page: z.coerce.number().int().min(1),
    limit: z.coerce.number().int().min(1).max(50),
  })
  .refine((d) => d.minAge <= d.maxAge, {
    message: "Minimum age must be less than or equal to maximum age",
    path: ["maxAge"],
  });

export type ProfileInput = z.infer<typeof profileSchema>;
export type PreferenceInput = z.infer<typeof preferenceSchema>;
