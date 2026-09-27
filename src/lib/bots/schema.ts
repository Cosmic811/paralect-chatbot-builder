import { z } from 'zod';

export const createBotSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Bot name is required.')
    .max(80, 'Bot name must be 80 characters or less.'),

  description: z.string().trim().max(300, 'Description must be 300 characters or less.'),
});
