import { z } from 'zod';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'video/mp4',
  'video/quicktime',
  'audio/mpeg',
  'audio/wav',
];

export const abuseReportSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').optional(),
  incidentDescription: z.string().min(20, 'Description must be at least 20 characters'),
  incidentDate: z.string().optional(),
  location: z.string().optional(),
  involvedParties: z.string().optional(),
  anonymous: z.boolean().default(true),
  reporterContact: z.string().email('Invalid email address').optional().or(z.literal('')),
  evidence: z
    .array(
      z
        .instanceof(File)
        .refine((file) => file.size <= MAX_FILE_SIZE, 'File size must be less than 10MB')
        .refine(
          (file) => ACCEPTED_FILE_TYPES.includes(file.type),
          'Invalid file type'
        )
    )
    .optional(),
});

export type AbuseReportFormData = z.infer<typeof abuseReportSchema>;

export const reportTrackingSchema = z.object({
  trackingId: z.string().min(1, 'Please enter a tracking ID'),
});

export type ReportTrackingFormData = z.infer<typeof reportTrackingSchema>;
