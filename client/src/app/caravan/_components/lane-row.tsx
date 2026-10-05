import type { GameStateDto } from '@/lib/api';

type Props = {
  title: string;
  lanes: GameStateDto['lanes'];
  onLaneClick?: (laneId: string) => void;
  onTargetClick: (laneId: string, targetCardId: string) => void;
};

export function LaneRow({ title, lanes, onLaneClick, onTargetClick }: Props) {
  return (
    <div>
      <p className="mb-2 text-sm text-default-500">{title}</p>

      <div className="grid grid-cols-3 gap-3">
        {lanes.map((lane) => (
          <div
            key={lane.id}
            onClick={() => onLaneClick?.(lane.id)}
            className={`flex min-h-24 flex-col gap-1 rounded border border-default-300 p-2 ${
              onLaneClick ? 'cursor-pointer hover:border-primary' : ''
            }`}
          >
            <p className="text-xs text-default-400">{lane.direction ?? '—'}</p>

            {lane.cards.map((card) => (
              <div
                key={card.numberCard.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onTargetClick(lane.id, card.numberCard.id);
                }}
                className="cursor-pointer rounded bg-default-100 px-2 py-1 text-xs"
              >
                {card.numberCard.rank}
                {card.attachedFaces.length > 0 &&
                  ` (фигур: ${card.attachedFaces.length})`}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
