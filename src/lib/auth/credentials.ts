import { z } from 'zod';

export const credentialsSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),

  password: z
    .string()
    .min(8, 'Password must contain at least 8 characters.')
    .max(128, 'Password is too long.'),
});
