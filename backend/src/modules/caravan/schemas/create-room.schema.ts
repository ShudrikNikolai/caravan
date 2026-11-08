import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CreateRoomSchema = z.object({
  visibility: z.enum(['private', 'public']).default('private'),
});

export class CreateRoomDto extends createZodDto(CreateRoomSchema) {}
