import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const StatsPaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export class StatsPaginationQueryDto extends createZodDto(
  StatsPaginationQuerySchema,
) {}
