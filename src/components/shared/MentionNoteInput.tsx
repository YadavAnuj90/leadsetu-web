'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AtSign } from 'lucide-react';
import { fetchTeam } from '@/lib/team-api';
import type { TeamMember } from '@/types/contracts';

let cachedMembers: TeamMember[] | null = null;
let pendingFetch: Promise<TeamMember[]> | null = null;

async function loadTeamMembersOnce(): Promise<TeamMember[]> {
  if (cachedMembers) return cachedMembers;
  if (!pendingFetch) {
    pendingFetch = fetchTeam()
      .then((res): TeamMember[] => {
        const list = (res.data || []).filter((m) => m.isActive !== false);
        cachedMembers = list;
        return list;
      })
      .catch((): TeamMember[] => [])
      .finally(() => {
        pendingFetch = null;
      });
  }
  return pendingFetch;
}

function toMentionHandle(member: TeamMember): string {
  const cleanName = String(member.name || '')
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '');
  if (cleanName.length >= 2) return cleanName;
  return (member.email || 'rep').split('@')[0];
}

export function MentionText({ text }: { text: string }) {
  const parts = String(text || '').split(/(@[a-zA-Z0-9._-]{2,40})/g);
  return (
    <>
      {parts.map((part, idx) =>
        /^@[a-zA-Z0-9._-]{2,40}$/.test(part) ? (
          <span
            key={idx}
            className="inline-flex items-center rounded-md bg-blue-50 px-1.5 py-0.5 text-[0.9em] font-bold text-brand-blue dark:bg-blue-500/20 dark:text-sky-300"
          >
            {part}
          </span>
        ) : (
          <React.Fragment key={idx}>{part}</React.Fragment>
        ),
      )}
    </>
  );
}

interface MentionNoteInputProps {
  value: string;
  onChange: (nextValue: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function MentionNoteInput({
  value,
  onChange,
  placeholder,
  className = '',
  disabled = false,
}: MentionNoteInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [members, setMembers] = useState<TeamMember[]>(cachedMembers || []);
  const [mentionRange, setMentionRange] = useState<{
    start: number;
    end: number;
    query: string;
  } | null>(null);
  const [highlightIdx, setHighlightIdx] = useState(0);

  useEffect(() => {
    void loadTeamMembersOnce().then((list) => {
      if (list.length > 0) setMembers(list);
    });
  }, []);

  useEffect(() => {
    const onPointerDown = (ev: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(ev.target as Node)
      ) {
        setMentionRange(null);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const suggestions = useMemo(() => {
    if (!mentionRange) return [];
    const q = mentionRange.query.toLowerCase();
    return members
      .filter((m) => {
        if (!q) return true;
        const handle = toMentionHandle(m).toLowerCase();
        return (
          m.name.toLowerCase().includes(q) ||
          handle.includes(q) ||
          m.email.toLowerCase().includes(q)
        );
      })
      .slice(0, 6);
  }, [members, mentionRange]);

  const detectMentionTrigger = (text: string, caretPos: number | null) => {
    const pos = caretPos ?? text.length;
    const prefix = text.slice(0, pos);
    const match = prefix.match(/(?:^|\s)@([a-zA-Z0-9._-]*)$/);
    if (!match) {
      setMentionRange(null);
      return;
    }
    const query = match[1] || '';
    const atIndex = prefix.lastIndexOf('@');
    if (atIndex < 0) {
      setMentionRange(null);
      return;
    }
    setMentionRange({ start: atIndex, end: pos, query });
    setHighlightIdx(0);
  };

  const insertMention = (member: TeamMember) => {
    if (!mentionRange) return;
    const handle = toMentionHandle(member);
    const before = value.slice(0, mentionRange.start);
    const after = value.slice(mentionRange.end);
    const next = `${before}@${handle}${after.startsWith(' ') ? '' : ' '}${after}`;
    onChange(next);
    setMentionRange(null);
    const nextCaret = before.length + handle.length + 2;
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(nextCaret, nextCaret);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!mentionRange || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      insertMention(suggestions[highlightIdx]);
    } else if (e.key === 'Escape') {
      setMentionRange(null);
    }
  };

  return (
    <div ref={containerRef} className="relative flex-1">
      <input
        ref={inputRef}
        type="text"
        disabled={disabled}
        value={value}
        onChange={(e) => {
          const nextVal = e.target.value;
          onChange(nextVal);
          detectMentionTrigger(nextVal, e.target.selectionStart);
        }}
        onClick={(e) =>
          detectMentionTrigger(
            e.currentTarget.value,
            e.currentTarget.selectionStart,
          )
        }
        onKeyDown={handleKeyDown}
        placeholder={placeholder || 'Add a note... Type @ to mention a teammate'}
        className={className}
      />

      {mentionRange && suggestions.length > 0 && (
        <div className="absolute left-0 bottom-full mb-2 w-72 max-w-[90vw] rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/15 dark:border-slate-700 dark:bg-[#0F172A] z-50 overflow-hidden">
          <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <AtSign className="w-3 h-3 text-brand-blue" />
            <span>Mention teammate (triggers bell alert)</span>
          </div>
          <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {suggestions.map((m, idx) => {
              const handle = toMentionHandle(m);
              const active = idx === highlightIdx;
              const avail = m.availabilityStatus || 'available';
              return (
                <button
                  key={m.id}
                  type="button"
                  onMouseDown={(ev) => {
                    ev.preventDefault();
                    insertMention(m);
                  }}
                  onMouseEnter={() => setHighlightIdx(idx)}
                  className={`w-full px-3 py-2 text-left flex items-center justify-between gap-2 text-xs transition ${
                    active
                      ? 'bg-blue-50/80 text-brand-navy dark:bg-blue-500/20 dark:text-white'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="font-bold truncate">{m.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">
                      @{handle} · {m.role}
                    </div>
                  </div>
                  <span
                    title={avail}
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      avail === 'available'
                        ? 'bg-emerald-500'
                        : avail === 'away'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
