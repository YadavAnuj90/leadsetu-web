'use client';

import { create } from 'zustand';
import type { CallHistoryStats, TenantPresenceMember } from '@/lib/calls-api';

export type AgentPresenceStatus = 'online' | 'busy' | 'offline';
export type CallIcePath = 'direct' | 'turn_relay' | 'failed';

export type CallSessionState =
  | 'idle'
  | 'ringing_outgoing'
  | 'ringing_incoming'
  | 'connecting'
  | 'connected'
  | 'ended';

export type CallDirection = 'outgoing' | 'incoming';

export type CallOutcome =
  | 'completed'
  | 'missed'
  | 'rejected'
  | 'cancelled'
  | 'timeout'
  | 'failed';

export interface CallPeerInfo {
  id: string;
  name: string;
  role: string;
  userCode?: string;
  territory?: string;
}

export interface ActiveCallSession {
  id: string;
  peer: CallPeerInfo;
  direction: CallDirection;
  startedAt: string;
  answeredAt?: string | null;
  connectedAt?: string | null;
  durationSec: number;
  isMuted: boolean;
  peerMuted: boolean;
  isSpeakerBoost: boolean;
  icePath: CallIcePath;
  relayProtocol?: string;
  isReconnecting?: boolean;
  rttMs: number;
  endReason?: string;
}

export interface CallHistoryEntry {
  id: string;
  peerId: string;
  peerName: string;
  peerRole: string;
  peerUserCode?: string;
  direction: CallDirection;
  status: string;
  startedAt: string;
  answeredAt?: string | null;
  connectedAt?: string | null;
  endedAt?: string | null;
  durationSeconds: number;
  setupTimeMs: number;
  endReason?: string;
  connection?: {
    icePath: CallIcePath;
    turnUsed: boolean;
    relayProtocol: string;
    rttMs: number;
    maxRttMs: number;
    packetsLost: number;
    bytesSent: number;
    bytesReceived: number;
    iceFailureReason: string;
  };
}

export interface CallEngineHandlers {
  initiateCall: (peer: CallPeerInfo) => Promise<void>;
  acceptIncomingCall: () => Promise<void>;
  rejectIncomingCall: () => void;
  endCall: (reason?: string) => Promise<void>;
  toggleMute: () => void;
  setPresence: (status: AgentPresenceStatus) => void;
  refreshHistory: (filter?: string) => Promise<void>;
}

interface CallUiState {
  socketConnected: boolean;
  myStatus: AgentPresenceStatus;
  dialerDrawerOpen: boolean;
  isMinimized: boolean;
  dialInput: string;
  callState: CallSessionState;
  ringSecondsLeft: number;
  activeCall: ActiveCallSession | null;
  errorBanner: string | null;

  presenceRoster: TenantPresenceMember[];
  history: CallHistoryEntry[];
  historyStats: CallHistoryStats;
  loadingHistory: boolean;

  handlers: CallEngineHandlers | null;

  setHandlers: (handlers: CallEngineHandlers | null) => void;
  setSocketConnected: (connected: boolean) => void;
  setMyStatusLocal: (status: AgentPresenceStatus) => void;
  setPresenceRoster: (roster: TenantPresenceMember[]) => void;
  setDialerDrawerOpen: (open: boolean) => void;
  setMinimized: (minimized: boolean) => void;
  setDialInput: (value: string) => void;
  appendDialDigit: (digit: string) => void;
  backspaceDialDigit: () => void;
  setErrorBanner: (msg: string | null) => void;

  setSessionState: (
    next: Partial<
      Pick<
        CallUiState,
        'callState' | 'activeCall' | 'ringSecondsLeft' | 'isMinimized'
      >
    >,
  ) => void;
  updateActiveCall: (patch: Partial<ActiveCallSession>) => void;
  setHistoryData: (data: CallHistoryEntry[], stats: CallHistoryStats) => void;
  setLoadingHistory: (loading: boolean) => void;
  tickTimers: () => void;
}

const DEFAULT_TIMEOUT_SEC = 30;

export const useCallUiStore = create<CallUiState>((set, get) => ({
  socketConnected: false,
  myStatus: 'online',
  dialerDrawerOpen: false,
  isMinimized: false,
  dialInput: '',
  callState: 'idle',
  ringSecondsLeft: DEFAULT_TIMEOUT_SEC,
  activeCall: null,
  errorBanner: null,

  presenceRoster: [],
  history: [],
  historyStats: { total: 0, answered: 0, missed: 0, avgDurationSec: 0 },
  loadingHistory: false,

  handlers: null,

  setHandlers: (handlers) => set({ handlers }),
  setSocketConnected: (socketConnected) => set({ socketConnected }),
  setMyStatusLocal: (myStatus) => set({ myStatus }),
  setPresenceRoster: (presenceRoster) => set({ presenceRoster }),
  setDialerDrawerOpen: (dialerDrawerOpen) => set({ dialerDrawerOpen }),
  setMinimized: (isMinimized) => set({ isMinimized }),
  setDialInput: (dialInput) => set({ dialInput }),
  appendDialDigit: (digit) =>
    set((s) => ({
      dialInput: s.dialInput.length < 20 ? `${s.dialInput}${digit}` : s.dialInput,
    })),
  backspaceDialDigit: () =>
    set((s) => ({ dialInput: s.dialInput.slice(0, -1) })),
  setErrorBanner: (errorBanner) => set({ errorBanner }),

  setSessionState: (next) => set(next),
  updateActiveCall: (patch) =>
    set((s) =>
      s.activeCall ? { activeCall: { ...s.activeCall, ...patch } } : s,
    ),
  setHistoryData: (history, historyStats) => set({ history, historyStats }),
  setLoadingHistory: (loadingHistory) => set({ loadingHistory }),

  tickTimers: () => {
    const { callState, activeCall, ringSecondsLeft } = get();
    if (!activeCall) return;

    if (callState === 'connected') {
      const startIso = activeCall.connectedAt || activeCall.answeredAt;
      const computedSec = startIso
        ? Math.max(
            0,
            Math.floor((Date.now() - Date.parse(startIso)) / 1000),
          )
        : activeCall.durationSec + 1;
      set({
        activeCall: {
          ...activeCall,
          durationSec: computedSec,
        },
      });
      return;
    }

    if (
      (callState === 'ringing_incoming' || callState === 'ringing_outgoing') &&
      ringSecondsLeft > 0
    ) {
      set({ ringSecondsLeft: Math.max(0, ringSecondsLeft - 1) });
    }
  },
}));

export function formatCallDuration(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
