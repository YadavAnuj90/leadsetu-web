'use client';

import React, { useMemo } from 'react';

interface QrPreviewProps {
  value: string;
  size?: number;
  color?: string;
}

const GRID_SIZE = 21;

function isFinderModule(r: number, c: number): boolean {
  const inTopLeft = r < 7 && c < 7;
  const inTopRight = r < 7 && c >= GRID_SIZE - 7;
  const inBottomLeft = r >= GRID_SIZE - 7 && c < 7;
  return inTopLeft || inTopRight || inBottomLeft;
}

function isFinderFilled(r: number, c: number): boolean {
  const localR = r >= GRID_SIZE - 7 ? r - (GRID_SIZE - 7) : r;
  const localC = c >= GRID_SIZE - 7 ? c - (GRID_SIZE - 7) : c;
  if (
    localR === 0 ||
    localR === 6 ||
    localC === 0 ||
    localC === 6
  ) {
    return true;
  }
  if (localR >= 2 && localR <= 4 && localC >= 2 && localC <= 4) {
    return true;
  }
  return false;
}

function isQuietSeparator(r: number, c: number): boolean {
  if (r === 7 && c <= 7) return true;
  if (c === 7 && r <= 7) return true;
  if (r === 7 && c >= GRID_SIZE - 8) return true;
  if (c === GRID_SIZE - 8 && r <= 7) return true;
  if (r === GRID_SIZE - 8 && c <= 7) return true;
  if (c === 7 && r >= GRID_SIZE - 8) return true;
  return false;
}

export default function QrPreview({
  value,
  size = 180,
  color = '#0F172A',
}: QrPreviewProps) {
  const modules = useMemo(() => {
    let hash = 2166136261;
    const text = value || 'https://leadsetu.app/f/demo';
    for (let i = 0; i < text.length; i++) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }

    const cells: boolean[][] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      const row: boolean[] = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        if (isFinderModule(r, c)) {
          row.push(isFinderFilled(r, c));
        } else if (isQuietSeparator(r, c)) {
          row.push(false);
        } else {
          // Deterministic pseudo-random bit from hash + coordinates
          const seed = Math.imul(hash ^ (r * 31 + c * 17), 2654435761) >>> 0;
          row.push((seed & 1) === 1 || (r === 6 && c % 2 === 0) || (c === 6 && r % 2 === 0));
        }
      }
      cells.push(row);
    }
    return cells;
  }, [value]);

  return (
    <div className="inline-flex flex-col items-center gap-2">
      <div
        className="p-3 rounded-2xl border border-slate-200 shadow-sm"
        style={{ backgroundColor: '#FFFFFF' }}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${GRID_SIZE} ${GRID_SIZE}`}
          role="img"
          aria-label={`QR preview for ${value}`}
          className="block"
        >
          <rect width={GRID_SIZE} height={GRID_SIZE} fill="#FFFFFF" />
          {modules.map((row, r) =>
            row.map((filled, c) =>
              filled ? (
                <rect
                  key={`${r}-${c}`}
                  x={c}
                  y={r}
                  width={0.92}
                  height={0.92}
                  rx={0.18}
                  fill={color}
                />
              ) : null,
            ),
          )}
        </svg>
      </div>
      <span className="text-[10.5px] font-semibold text-slate-400">
        QR Preview · Auto-tags scan attribution
      </span>
    </div>
  );
}
