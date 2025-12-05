import { z } from 'zod';

export const transactionCreateSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().positive(),
  description: z.string().max(500).optional(),
  category: z.string().max(100).optional(),
  account: z.string().min(1).max(50).optional(),
  date: z.coerce.date().optional(),
  isRecurring: z.boolean().optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
  nextDueDate: z.coerce.date().optional(),
  currency: z.string().length(3).optional(),
  tags: z.array(z.string()).optional(),
});

export const transactionUpdateSchema = transactionCreateSchema.partial();

export const categoryCreateSchema = z.object({
  name: z.string().min(1).max(50),
  type: z.enum(['income', 'expense']),
  color: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/).optional(),
  icon: z.string().max(50).optional(),
});

export const categoryUpdateSchema = categoryCreateSchema.partial();

export const budgetCreateSchema = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  amount: z.number().positive(),
  category: z.string().max(100).optional(),
});

export const budgetUpdateSchema = budgetCreateSchema.partial();

export const accountCreateSchema = z.object({
  name: z.string().min(1).max(50),
});
