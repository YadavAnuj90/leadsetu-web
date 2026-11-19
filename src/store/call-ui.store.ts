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
  callerType?: 'agent' | 'customer';
  customerPhone?: string;
  linkedEntityType?: '' | 'lead' | 'deal' | 'ticket' | 'contact';
  linkedEntityId?: string;
  linkedEntityLabel?: string;
  transferredFromName?: string;
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
  isOnHold?: boolean;
  peerOnHold?: boolean;
  isRecording?: boolean;
  isUploadingRecording?: boolean;
  isSpeakerBoost: boolean;
  icePath: CallIcePath;
  relayProtocol?: string;
  isReconnecting?: boolean;
  rttMs: number;
  endReason?: string;
  notes?: string;
  outcomeTag?: string;
  linkedEntityType?: '' | 'lead' | 'deal' | 'ticket' | 'contact';
  linkedEntityId?: string;
  linkedEntityLabel?: string;
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
  callChannel?: 'webrtc' | 'sim_mobile';
  callerType?: 'agent' | 'customer';
  customerPhone?: string;
  linkedEntityType?: '' | 'lead' | 'deal' | 'ticket' | 'contact';
  linkedEntityId?: string;
  linkedEntityLabel?: string;
  notes?: string;
  outcomeTag?: string;
  followUpTaskId?: string;
  dispositionAt?: string | null;
  callbackResolved?: boolean;
  callbackResolvedAt?: string | null;
  recordingUrl?: string;
  recordingDurationSeconds?: number;
  recordedAt?: string | null;
  transferredFromName?: string;
  transferredToName?: string;
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

export interface SimCallSession {
  id: string;
  startedAtMs: number;
  contactName: string;
  contactPhone: string;
  company?: string;
  linkedEntityType: '' | 'lead' | 'deal' | 'ticket' | 'contact';
  linkedEntityId: string;
  linkedEntityLabel: string;
}

export interface DispositionModalCall {
  mode?: 'webrtc' | 'sim';
  callId: string;
  peerName: string;
  durationSeconds: number;
  customerPhone?: string;
  company?: string;
  simStatus?: 'completed' | 'missed' | 'rejected';
  linkedEntityType?: '' | 'lead' | 'deal' | 'ticket' | 'contact';
  linkedEntityId?: string;
  linkedEntityLabel?: string;
  notes?: string;
  outcomeTag?: string;
}

export interface CallEngineHandlers {
  initiateCall: (peer: CallPeerInfo) => Promise<void>;
  acceptIncomingCall: () => Promise<void>;
  rejectIncomingCall: () => void;
  endCall: (reason?: string) => Promise<void>;
  toggleMute: () => void;
  toggleHold: () => void;
  toggleRecording: () => void;
  transferCall: (targetUserCode: string) => Promise<boolean>;
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
  dispositionModalCall: DispositionModalCall | null;
  activeSimCall: SimCallSession | null;

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
  setDispositionModalCall: (call: DispositionModalCall | null) => void;
  startSimCall: (payload: Omit<SimCallSession, 'id' | 'startedAtMs'>) => void;
  promptSimDisposition: () => void;
  clearSimCall: () => void;
  hydrateSimCall: () => void;

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
const SIM_CALL_STORAGE_KEY = 'leadsetu_pending_sim_call';

function saveSimSessionToStorage(session: SimCallSession | null) {
  if (typeof window === 'undefined') return;
  try {
    if (session) {
      window.sessionStorage.setItem(
        SIM_CALL_STORAGE_KEY,
        JSON.stringify(session),
      );
    } else {
      window.sessionStorage.removeItem(SIM_CALL_STORAGE_KEY);
    }
  } catch {
    // Ignore sessionStorage restrictions
  }
}

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
  historyStats: {
    total: 0,
    answered: 0,
    missed: 0,
    avgDurationSec: 0,
    pendingCallbacks: 0,
  },
  loadingHistory: false,
  dispositionModalCall: null,
  activeSimCall: null,

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
  setDispositionModalCall: (dispositionModalCall) =>
    set({ dispositionModalCall }),

  startSimCall: (payload) => {
    const session: SimCallSession = {
      id: `sim_${Date.now()}`,
      startedAtMs: Date.now(),
      ...payload,
    };
    saveSimSessionToStorage(session);
    set({ activeSimCall: session });
  },

  promptSimDisposition: () => {
    const sim = get().activeSimCall;
    if (!sim) return;
    const elapsedSec = Math.max(
      1,
      Math.round((Date.now() - sim.startedAtMs) / 1000),
    );
    saveSimSessionToStorage(null);
    set({
      activeSimCall: null,
      dispositionModalCall: {
        mode: 'sim',
        callId: '',
        peerName: sim.contactName,
        durationSeconds: elapsedSec,
        customerPhone: sim.contactPhone,
        company: sim.company,
        simStatus: 'completed',
        linkedEntityType: sim.linkedEntityType,
        linkedEntityId: sim.linkedEntityId,
        linkedEntityLabel: sim.linkedEntityLabel,
      },
    });
  },

  clearSimCall: () => {
    saveSimSessionToStorage(null);
    set({ activeSimCall: null });
  },

  hydrateSimCall: () => {
    if (typeof window === 'undefined' || get().activeSimCall) return;
    try {
      const raw = window.sessionStorage.getItem(SIM_CALL_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as SimCallSession;
      if (parsed && parsed.startedAtMs && Date.now() - parsed.startedAtMs < 3600_000) {
        set({ activeSimCall: parsed });
      } else {
        saveSimSessionToStorage(null);
      }
    } catch {
      saveSimSessionToStorage(null);
    }
  },

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
