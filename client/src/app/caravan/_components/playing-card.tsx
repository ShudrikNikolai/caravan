import type { ReactNode } from 'react';

export type CardLike = { rank: number | string; suit?: string | null };
export type SuitKey = 'hearts' | 'diamonds' | 'clubs' | 'spades';

const RED = '#c8302f';
const INK = '#1c1c24';
const PAPER = '#fbf8f1';
const EDGE = '#d9d2c3';
const ROYAL = '#6d28d9';
const FONT = "Georgia, 'Times New Roman', serif";

const SUIT_NAMES: Record<SuitKey, string> = {
  hearts: 'червей',
  diamonds: 'бубен',
  clubs: 'треф',
  spades: 'пик',
};
const FACE_NAMES: Record<string, string> = {
  J: 'Валет',
  Q: 'Дама',
  K: 'Король',
  JOKER: 'Джокер',
};

/** Понимает 'hearts' / 'H' / '♥' / 'червы' и т.п. */
export function normalizeSuit(suit?: string | null): SuitKey | null {
  const s = String(suit ?? '')
    .trim()
    .toLowerCase();
  if (!s) return null;
  if (['h', '♥', '♡'].includes(s) || /heart|черв/.test(s)) return 'hearts';
  if (['d', '♦', '♢'].includes(s) || /diamond|бубн/.test(s)) return 'diamonds';
  if (['c', '♣', '♧'].includes(s) || /club|треф/.test(s)) return 'clubs';
  if (['s', '♠', '♤'].includes(s) || /spade|пик/.test(s)) return 'spades';
  return null;
}

function numericRank(rank: number | string): number | null {
  if (typeof rank === 'number') return rank;
  const s = String(rank).toUpperCase();
  if (s === 'A') return 1;
  return /^\d+$/.test(s) ? Number(s) : null;
}

function faceRank(rank: number | string): 'J' | 'Q' | 'K' | 'JOKER' | null {
  const s = String(rank).toUpperCase();
  return s === 'J' || s === 'Q' || s === 'K' || s === 'JOKER' ? s : null;
}

/** Человекочитаемое название карты: «7 червей», «Король пик», «Джокер». */
export function cardLabel(card: CardLike): string {
  const face = faceRank(card.rank);
  if (face === 'JOKER') return 'Джокер';
  const suit = normalizeSuit(card.suit);
  const suitText = suit ? ` ${SUIT_NAMES[suit]}` : '';
  if (face) return `${FACE_NAMES[face]}${suitText}`;
  if (numericRank(card.rank) === 1) return `Туз${suitText}`;
  return `${card.rank}${suitText}`;
}

function rankText(card: CardLike): string {
  const face = faceRank(card.rank);
  if (face) return face;
  return numericRank(card.rank) === 1 ? 'A' : String(card.rank);
}

/* ---------- масти ---------- */

const SUIT_SHAPES: Record<SuitKey, ReactNode> = {
  hearts: (
    <path d="M12 21.5C4 15 2 11 2 7.8 2 4.9 4.2 3 6.8 3c2.2 0 4.1 1.2 5.2 3.2C13.1 4.2 15 3 17.2 3 19.8 3 22 4.9 22 7.8c0 3.2-2 7.2-10 13.7Z" />
  ),
  diamonds: (
    <path d="M12 1.5C14.5 6 18.5 9 21 12c-2.5 3-6.5 6-9 10.5C9.5 18 5.5 15 3 12c2.5-3 6.5-6 9-10.5Z" />
  ),
  spades: (
    <path d="M12 1.5c4 5 9 8 9 12.5 0 3-2.3 5-4.8 5-1.6 0-2.9-.7-3.7-1.8.2 2.4 1 3.8 3 5.3H8.5c2-1.5 2.8-2.9 3-5.3-.8 1.1-2.1 1.8-3.7 1.8C5.3 19 3 17 3 14c0-4.5 5-7.5 9-12.5Z" />
  ),
  clubs: (
    <>
      <circle cx="12" cy="7.5" r="4.6" />
      <circle cx="6.6" cy="14" r="4.6" />
      <circle cx="17.4" cy="14" r="4.6" />
      <path d="M12 11c0 5-.5 8.5-3.5 11h7C12.5 19.5 12 16 12 11Z" />
    </>
  ),
};

function SuitShape({
  suit,
  x,
  y,
  size,
  color,
  flip,
}: {
  suit: SuitKey;
  x: number;
  y: number;
  size: number;
  color: string;
  flip?: boolean;
}) {
  return (
    <g
      transform={`translate(${x} ${y})${flip ? ' rotate(180)' : ''} scale(${size / 24}) translate(-12 -12)`}
      fill={color}
    >
      {SUIT_SHAPES[suit]}
    </g>
  );
}

/* ---------- раскладка пипсов для 1–10 ---------- */

const L = 32;
const C = 50;
const R = 68;
type Pt = [number, number];
const SIDES: Pt[] = [
  [L, 31],
  [R, 31],
  [L, 57],
  [R, 57],
  [L, 83],
  [R, 83],
  [L, 109],
  [R, 109],
];
const SIX: Pt[] = [
  [L, 32],
  [R, 32],
  [L, 70],
  [R, 70],
  [L, 108],
  [R, 108],
];
const PIPS: Record<number, Pt[]> = {
  1: [[C, 70]],
  2: [
    [C, 32],
    [C, 108],
  ],
  3: [
    [C, 32],
    [C, 70],
    [C, 108],
  ],
  4: [
    [L, 32],
    [R, 32],
    [L, 108],
    [R, 108],
  ],
  5: [
    [L, 32],
    [R, 32],
    [C, 70],
    [L, 108],
    [R, 108],
  ],
  6: SIX,
  7: [...SIX, [C, 51]],
  8: [...SIX, [C, 51], [C, 89]],
  9: [...SIDES, [C, 70]],
  10: [...SIDES, [C, 44], [C, 96]],
};

/* ---------- мелкие декоративные элементы ---------- */

function starPoints(cx: number, cy: number, outer: number, inner: number) {
  return Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 === 0 ? outer : inner;
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
}

const CROWNS: Record<'J' | 'Q' | 'K', string> = {
  K: 'M-11 6L-11-4-5.5 1 0-7 5.5 1 11-4 11 6Z',
  Q: 'M-11 6L-11-2-7 2-3.5-5 0 2 3.5-5 7 2 11-2 11 6Z',
  J: 'M-9 6Q-9-4 0-4T9 6ZM3-4Q10-12 14-6 9-8 6-3Z',
};

/* ---------- карта ---------- */

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
          {suit && <SuitShape suit={suit} x={11} y={34} size={10} color={color} />}
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
        <rect x={22} y={22} width={56} height={96} rx={3} fill={color} opacity={0.05} />
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
        <line x1={22} y1={70} x2={78} y2={70} stroke={color} strokeWidth={0.8} opacity={0.5} />
        {half}
        <g transform="rotate(180 50 70)">{half}</g>
        <circle cx={50} cy={70} r={8.5} fill={PAPER} stroke={color} strokeWidth={1} />
        {suit && <SuitShape suit={suit} x={50} y={70} size={11} color={color} />}
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
