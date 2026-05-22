import { z } from 'zod';
import { FederationMemberRole } from '@/types';

export const addMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.nativeEnum(FederationMemberRole, {
    errorMap: () => ({ message: 'Please select a role' }),
  }),
  invitationMessage: z.string().optional(),
});

export type AddMemberFormData = z.infer<typeof addMemberSchema>;
