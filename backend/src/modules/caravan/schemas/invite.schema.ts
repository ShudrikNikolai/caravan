import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const InviteSchema = z.object({
  rivalId: z.string().uuid(),
});

export class InviteDto extends createZodDto(InviteSchema) {}
