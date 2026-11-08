import type { ReactNode } from 'react';

import {
  CROWNS,
  EDGE,
  FONT,
  INK,
  PAPER,
  PIPS,
  RED,
  ROYAL,
  SuitShape,
  cardLabel,
  faceRank,
  numericRank,
  normalizeSuit,
  rankText,
  starPoints,
  type CardLike,
} from './card-visuals';

export type { CardLike, SuitKey } from './card-visuals';
export { cardLabel, normalizeSuit } from './card-visuals';

export function PlayingCard({
  card,
  className = '',
}: {
  card: CardLike;
  className?: string;
}) {
  const face = faceRank(card.rank);
  const isJoker = face === 'JOKER';
  const suit = normalizeSuit(card.suit);
  const n = numericRank(card.rank);

  const isRed =
    suit === 'hearts' ||
    suit === 'diamonds' ||
    (isJoker && /red|крас/i.test(String(card.suit ?? '')));
  const color = isRed ? RED : INK;
  const label = rankText(card);

  const index = (
    <g>
      {isJoker ? (
        <polygon points={starPoints(11, 19, 7.5, 3.2)} fill={ROYAL} />
      ) : (
        <>
          <text
            x={11}
            y={22}
            textAnchor="middle"
            fontSize={label.length > 1 ? 14 : 16}
            fontWeight={700}
            fill={color}
            fontFamily={FONT}
          >
            {label}
          </text>
          {suit && (
            <SuitShape suit={suit} x={11} y={34} size={10} color={color} />
          )}
        </>
      )}
    </g>
  );

  let body: ReactNode;

  if (isJoker) {
    body = (
      <g>
        <circle cx={50} cy={64} r={31} fill={ROYAL} opacity={0.08} />
        <polygon points={starPoints(50, 64, 27, 11.5)} fill={ROYAL} />
        <polygon points={starPoints(50, 64, 15, 6.5)} fill={PAPER} />
        <circle cx={50} cy={64} r={3.5} fill={color} />
        <text
          x={50}
          y={114}
          textAnchor="middle"
          fontSize={10}
          fontWeight={700}
          letterSpacing={3}
          fill={color}
          fontFamily={FONT}
        >
          JOKER
        </text>
      </g>
    );
  } else if (face) {
    const half = (
      <g>
        <path
          d={CROWNS[face as 'J' | 'Q' | 'K']}
          transform="translate(50 33)"
          fill={color}
        />
        <text
          x={50}
          y={60}
          textAnchor="middle"
          fontSize={26}
          fontWeight={700}
          fill={color}
          fontFamily={FONT}
        >
          {face}
        </text>
      </g>
    );
    body = (
      <g>
        <rect
          x={22}
          y={22}
          width={56}
          height={96}
          rx={3}
          fill={color}
          opacity={0.05}
        />
        <rect
          x={22}
          y={22}
          width={56}
          height={96}
          rx={3}
          fill="none"
          stroke={color}
          strokeWidth={1.2}
        />
        <line
          x1={22}
          y1={70}
          x2={78}
          y2={70}
          stroke={color}
          strokeWidth={0.8}
          opacity={0.5}
        />
        {half}
        <g transform="rotate(180 50 70)">{half}</g>
        <circle
          cx={50}
          cy={70}
          r={8.5}
          fill={PAPER}
          stroke={color}
          strokeWidth={1}
        />
        {suit && (
          <SuitShape suit={suit} x={50} y={70} size={11} color={color} />
        )}
      </g>
    );
  } else if (n !== null && PIPS[n] && suit) {
    body = (
      <g>
        {PIPS[n].map(([x, y], i) => (
          <SuitShape
            key={i}
            suit={suit}
            x={x}
            y={y}
            size={n === 1 ? 42 : 20}
            color={color}
            flip={y > 70}
          />
        ))}
      </g>
    );
  } else {
    body = (
      <text
        x={50}
        y={84}
        textAnchor="middle"
        fontSize={44}
        fontWeight={700}
        fill={color}
        fontFamily={FONT}
      >
        {label}
      </text>
    );
  }

  return (
    <svg
      viewBox="0 0 100 140"
      role="img"
      aria-label={cardLabel(card)}
      className={`block h-auto w-full drop-shadow-md ${className}`}
    >
      <rect
        x={0.75}
        y={0.75}
        width={98.5}
        height={138.5}
        rx={9}
        fill={PAPER}
        stroke={EDGE}
        strokeWidth={1.5}
      />
      {index}
      <g transform="rotate(180 50 70)">{index}</g>
      {body}
    </svg>
  );
}
