import { z } from 'zod';

export const JoinRoomSchema = z.object({});

export type JoinRoomDto = z.infer<typeof JoinRoomSchema>;
