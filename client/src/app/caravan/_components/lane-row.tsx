import type { GameStateDto } from '@/lib/api';
import { cardLabel, PlayingCard } from './playing-card';

type Props = {
  title: string;
  lanes: GameStateDto['lanes'];
  /** Выбрана числовая карта и сейчас ваш ход: дорожки можно кликать */
  highlightLanes?: boolean;
  /** Выбрана фигура или джокер и сейчас ваш ход: карты-цели можно кликать */
  highlightTargets?: boolean;
  onLaneClick?: (laneId: string) => void;
  onTargetClick: (laneId: string, targetCardId: string) => void;
};

function directionLabel(direction: unknown) {
  const s = String(direction ?? '').toLowerCase();
  if (!direction) return 'Без направления';
  if (s.includes('asc') || s === 'up') return '▲ Возрастание';
  if (s.includes('desc') || s === 'down') return '▼ Убывание';
  return String(direction);
}

export function LaneRow({
  title,
  lanes,
  highlightLanes,
  highlightTargets,
  onLaneClick,
  onTargetClick,
}: Props) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
        {title}
      </h2>

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {lanes.map((lane) => {
          const active = !!onLaneClick && !!highlightLanes;
          return (
            <div
              key={lane.id}
              onClick={() => onLaneClick?.(lane.id)}
              // --cw: ширина карты, --fo: сдвиг приложенных фигур
              className={`flex min-h-44 flex-col gap-3 rounded-2xl border p-2 transition [--cw:3.25rem] [--fo:0.6rem] sm:min-h-56 sm:p-3 sm:[--cw:5.5rem] sm:[--fo:1rem] ${
                active
                  ? 'cursor-pointer border-indigo-400/70 bg-indigo-500/5 hover:bg-indigo-500/10'
                  : 'border-zinc-200 bg-zinc-50 dark:border-white/10 dark:bg-zinc-950/50'
              }`}
            >
              <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
                {directionLabel(lane.direction)}
              </p>

              <div className="flex flex-col">
                {lane.cards.length === 0 && (
                  <div className="aspect-[5/7] w-[var(--cw)] rounded-lg border-2 border-dashed border-zinc-300 dark:border-white/15" />
                )}

                {lane.cards.map((entry, idx) => (
                  <button
                    key={entry.numberCard.id}
                    type="button"
                    aria-label={`Цель: ${cardLabel(entry.numberCard)}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTargetClick(lane.id, entry.numberCard.id);
                    }}
                    style={{
                      paddingRight: `calc(var(--fo) * ${entry.attachedFaces.length})`,
                    }}
                    className={`group block self-start text-left ${
                      idx > 0 ? '-mt-[var(--cw)]' : ''
                    } ${highlightTargets ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <div
                      className={`relative w-[var(--cw)] rounded-lg transition ${
                        highlightTargets
                          ? 'ring-2 ring-indigo-400/60 group-hover:ring-indigo-400'
                          : ''
                      }`}
                    >
                      <PlayingCard card={entry.numberCard} />
                      {entry.attachedFaces.map((face, i) => (
                        <div
                          key={face.id}
                          className="absolute left-0 top-0 w-full"
                          style={{
                            transform: `translate(calc(var(--fo) * ${i + 1}), ${(i + 1) * 5}px)`,
                          }}
                        >
                          <PlayingCard card={face} />
                        </div>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
