'use client';

interface RoundCallMetricRingProps {
  value: number;
  total?: number;
  label: string;
  tone: 'blue' | 'emerald' | 'rose' | 'indigo';
  size?: 'sm' | 'md';
  displayText?: string;
}

const TONE_MAP = {
  blue: {
    stroke: '#3978EA',
    track: 'rgba(57, 120, 234, 0.16)',
    text: 'text-brand-blue dark:text-sky-400',
    glow: 'bg-blue-500/8 dark:bg-blue-500/10',
  },
  emerald: {
    stroke: '#10B981',
    track: 'rgba(16, 185, 129, 0.16)',
    text: 'text-emerald-600 dark:text-emerald-400',
    glow: 'bg-emerald-500/8 dark:bg-emerald-500/10',
  },
  rose: {
    stroke: '#F43F5E',
    track: 'rgba(244, 63, 94, 0.16)',
    text: 'text-rose-600 dark:text-rose-400',
    glow: 'bg-rose-500/8 dark:bg-rose-500/10',
  },
  indigo: {
    stroke: '#6366F1',
    track: 'rgba(99, 102, 241, 0.16)',
    text: 'text-indigo-600 dark:text-indigo-300',
    glow: 'bg-indigo-500/8 dark:bg-indigo-500/10',
  },
} as const;

/**
 * Small round SVG donut-ring badge displaying per-user Total / Answered / Missed call counts.
 */
export default function RoundCallMetricRing({
  value,
  total,
  label,
  tone,
  size = 'md',
  displayText,
}: RoundCallMetricRingProps) {
  const dim = size === 'sm' ? 48 : 60;
  const strokeWidth = size === 'sm' ? 4.5 : 5;
  const radius = (dim - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;

  const pct =
    value <= 0
      ? 0
      : total && total > 0
        ? Math.max(0.08, Math.min(1, value / total))
        : 1;
  const dashOffset = circumference * (1 - pct);
  const palette = TONE_MAP[tone];

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <div
        className={`relative rounded-full flex items-center justify-center ${palette.glow}`}
        style={{ width: dim, height: dim }}
      >
        <svg
          width={dim}
          height={dim}
          className="-rotate-90 transform"
          aria-hidden="true"
        >
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            fill="transparent"
            stroke={palette.track}
            strokeWidth={strokeWidth}
          />
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            fill="transparent"
            stroke={palette.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-all duration-500"
          />
        </svg>
        <span
          className={`absolute font-mono font-black ${
            size === 'sm' ? 'text-xs' : 'text-sm'
          } ${palette.text}`}
        >
          {displayText ?? value}
        </span>
      </div>
      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </span>
    </div>
  );
}
