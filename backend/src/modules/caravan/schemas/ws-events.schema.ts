import { z } from 'zod';

export const PlayNumberCardSchema = z.object({
  type: z.literal('play_number_card'),
  cardId: z.string(),
  laneId: z.string(),
});

export const PlayFaceCardSchema = z.object({
  type: z.literal('play_face_card'),
  cardId: z.string(),
  laneId: z.string(),
  targetCardId: z.string(),
});

export const DiscardCardSchema = z.object({
  type: z.literal('discard_card'),
  cardId: z.string(),
});

export const EndTurnSchema = z.object({
  type: z.literal('end_turn'),
});

export const ClientEventSchema = z.discriminatedUnion('type', [
  PlayNumberCardSchema,
  PlayFaceCardSchema,
  DiscardCardSchema,
  EndTurnSchema,
]);

export type ClientEvent = z.infer<typeof ClientEventSchema>;
