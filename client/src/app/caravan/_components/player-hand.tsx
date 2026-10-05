import { Button, Card, Description } from '@heroui/react';
import type { CaravanCard } from '@/lib/api';

type Props = {
  hand: (CaravanCard | null)[];
  selectedCard?: CaravanCard;
  isMyTurn: boolean;
  onSelect: (cardId: string | null) => void;
  onDiscard: () => void;
  onEndTurn: () => void;
};

export function PlayerHand({
  hand,
  selectedCard,
  isMyTurn,
  onSelect,
  onDiscard,
  onEndTurn,
}: Props) {
  return (
    <Card className="p-4">
      <Card.Content className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {hand.map((card) =>
            card ? (
              <button
                key={card.id}
                type="button"
                onClick={() =>
                  onSelect(card.id === selectedCard?.id ? null : card.id)
                }
                className={`rounded border px-3 py-2 text-sm ${
                  card.id === selectedCard?.id
                    ? 'border-primary bg-primary/10'
                    : 'border-default-300'
                }`}
              >
                {card.rank} {card.suit}
              </button>
            ) : null,
          )}
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            isDisabled={!selectedCard || !isMyTurn}
            onPress={onDiscard}
          >
            Сбросить выбранную
          </Button>
          <Button size="sm" isDisabled={!isMyTurn} onPress={onEndTurn}>
            Закончить ход
          </Button>
        </div>

        {selectedCard && (
          <Description className="text-sm">
            Выбрано: {selectedCard.rank} {selectedCard.suit}. Для числовой карты
            — кликните по своей дорожке. Для фигуры или джокера — кликните по
            карте-цели.
          </Description>
        )}
      </Card.Content>
    </Card>
  );
}
