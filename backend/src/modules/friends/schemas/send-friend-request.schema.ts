import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const SendFriendRequestSchema = z.object({
  addresseeId: z.string().uuid(),
});

export class SendFriendRequestDto extends createZodDto(
  SendFriendRequestSchema,
) {}
