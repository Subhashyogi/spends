import { z } from 'zod';

export const transactionCreateSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().positive(),
  description: z.string().max(500).optional(),
  category: z.string().max(100).optional(),
  date: z.coerce.date().optional(),
});

export const transactionUpdateSchema = transactionCreateSchema.partial();
