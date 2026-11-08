import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const SearchUsersQuerySchema = z.object({
  q: z.string().trim().min(2).max(64),
});

export class SearchUsersQueryDto extends createZodDto(SearchUsersQuerySchema) {}
