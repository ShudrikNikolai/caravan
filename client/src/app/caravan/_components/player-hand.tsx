import type { CaravanCard } from '@/lib/api';
import { cardLabel, PlayingCard } from './playing-card';
import { btn, panelClass } from '@/components/ui';

type Props = {
  hand: (CaravanCard | null)[];
  selectedCard?: CaravanCard;
  isMyTurn: boolean;
  blockedMessage?: string | null;
  onSelect: (cardId: string | null) => void;
  onDiscard: () => void;
  onEndTurn: () => void;
};

export function PlayerHand({
  hand,
  selectedCard,
  isMyTurn,
  blockedMessage,
  onSelect,
  onDiscard,
  onEndTurn,
}: Props) {
  const hint = blockedMessage
    ? blockedMessage
    : selectedCard
      ? typeof selectedCard.rank === 'number'
        ? `${cardLabel(selectedCard)}: кликните по своей дорожке, чтобы сыграть карту.`
        : `${cardLabel(selectedCard)}: кликните по карте-цели на любой дорожке.`
      : isMyTurn
        ? 'Выберите карту в руке.'
        : 'Ждём хода соперника…';

  return (
    <section className={`${panelClass} flex flex-col gap-5 p-4 sm:p-6`}>
      <div className="flex min-h-32 flex-wrap items-end justify-center gap-2 pt-3 sm:gap-4">
        {hand.map((card) => {
          if (!card) return null;
          const selected = card.id === selectedCard?.id;
          return (
            <button
              key={card.id}
              type="button"
              aria-pressed={selected}
              aria-label={cardLabel(card)}
              disabled={!!blockedMessage}
              onClick={() => onSelect(selected ? null : card.id)}
              className={`w-16 rounded-lg transition duration-150 sm:w-24 ${
                selected
                  ? '-translate-y-3 ring-2 ring-indigo-400 shadow-lg shadow-indigo-500/30'
                  : 'hover:-translate-y-1'
              }`}
            >
              <PlayingCard card={card} />
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{hint}</p>
        <div className="flex gap-2">
          <button
            type="button"
            className={btn('secondary', 'sm')}
            disabled={!selectedCard || !isMyTurn || !!blockedMessage}
            onClick={onDiscard}
          >
            Сбросить выбранную
          </button>
          <button
            type="button"
            className={btn('primary', 'sm')}
            disabled={!isMyTurn || !!blockedMessage}
            onClick={onEndTurn}
          >
            Закончить ход
          </button>
        </div>
      </div>
    </section>
  );
}
