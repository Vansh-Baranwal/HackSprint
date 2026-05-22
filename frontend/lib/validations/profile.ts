import { z } from 'zod';

export const athleteProfileSchema = z.object({
  dateOfBirth: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  nationality: z.string().optional().nullable(),
  primarySport: z.string().optional().nullable(),
  clubName: z.string().optional().nullable(),
  metadata: z.record(z.any()).optional().nullable(),
});

export type AthleteProfileFormData = z.infer<typeof athleteProfileSchema>;
