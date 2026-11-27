'use client';

import type { RefObject } from 'react';
import {
  IndianRupee,
  Loader2,
  Mic,
  MicOff,
  PhoneCall,
  PhoneOff,
  Radio,
  ShieldCheck,
} from 'lucide-react';
import type { ActiveWhatsappCallSession } from '@/hooks/useWhatsappWebRtc';

interface WhatsappCallDrawerProps {
  activeCall: ActiveWhatsappCallSession | null;
  remoteAudioRef: RefObject<HTMLAudioElement>;
  onToggleMute: () => void;
  onHangup: () => void;
}

function formatDurationClock(totalSec: number): string {
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function WhatsappCallDrawer({
  activeCall,
  remoteAudioRef,
  onToggleMute,
  onHangup,
}: WhatsappCallDrawerProps) {
  return (
    <>
      {/* Hidden audio element for remote WebRTC media stream */}
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

      {activeCall && (
        <div className="fixed bottom-3 inset-x-3 sm:inset-x-auto sm:bottom-5 sm:right-5 z-50 w-auto sm:w-[370px] max-w-full rounded-3xl bg-[#0D1628] text-white border border-emerald-500/40 shadow-2xl overflow-hidden">
          {/* Top Emerald Header Strip */}
          <div className="px-4 py-3 bg-gradient-to-r from-emerald-600/30 via-emerald-500/20 to-brand-blue/20 border-b border-white/10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-300">
                WhatsApp Cloud WebRTC
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-200 uppercase">
              {activeCall.direction === 'inbound' ? 'Inbound' : 'Outbound'}
            </span>
          </div>

          <div className="p-4 space-y-3.5">
            {/* Caller Identity (Preserves Masked Number) */}
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-extrabold text-white truncate">
                  {activeCall.contactName}
                </div>
                <div className="text-xs text-slate-300 truncate">
                  {activeCall.company ? `${activeCall.company} · ` : ''}
                  <span className="font-mono">{activeCall.displayPhone}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-mono text-lg font-extrabold text-white tabular-nums">
                  {formatDurationClock(activeCall.elapsedSeconds)}
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                  {activeCall.phase === 'connecting'
                    ? 'Connecting...'
                    : activeCall.phase === 'ending'
                      ? 'Wrapping Up...'
                      : activeCall.phase === 'ended'
                        ? 'Call Ended'
                        : 'Live Audio'}
                </div>
              </div>
            </div>

            {/* Live 6-Second Pulse INR Cost Ticker */}
            <div className="rounded-2xl bg-white/5 border border-white/10 px-3.5 py-2.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs">
                <IndianRupee className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                {activeCall.direction === 'outbound' ? (
                  <div>
                    <div className="font-bold text-white">
                      ₹{activeCall.costInr.toFixed(2)}{' '}
                      <span className="text-[11px] font-normal text-slate-300">
                        (Pulse #{activeCall.billedPulses})
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      6-sec pulse @ ₹{activeCall.rateInrPerMin.toFixed(2)}/min
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="font-bold text-emerald-300">₹0.00</div>
                    <div className="text-[10px] text-slate-400">
                      Inbound WhatsApp calls are free
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end gap-1">
                {activeCall.isUploadingRecording ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300">
                    <Loader2 className="w-3 h-3 animate-spin" /> Saving Audio
                  </span>
                ) : activeCall.isRecording ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-300">
                    <Radio className="w-3 h-3 animate-pulse" /> REC
                  </span>
                ) : null}
                {activeCall.simulated && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                    <ShieldCheck className="w-3 h-3" /> Sandbox
                  </span>
                )}
              </div>
            </div>

            {/* Call Controls */}
            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={onToggleMute}
                disabled={
                  activeCall.phase === 'ending' || activeCall.phase === 'ended'
                }
                className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl text-xs font-bold border transition-colors ${
                  activeCall.isMuted
                    ? 'border-amber-400/50 bg-amber-500/20 text-amber-200'
                    : 'border-white/15 bg-white/10 text-white hover:bg-white/15'
                } disabled:opacity-50`}
              >
                {activeCall.isMuted ? (
                  <>
                    <MicOff className="w-4 h-4" /> Unmute
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" /> Mute
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onHangup}
                disabled={
                  activeCall.phase === 'ending' || activeCall.phase === 'ended'
                }
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl text-xs font-extrabold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-colors disabled:opacity-50"
              >
                {activeCall.phase === 'ending' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <PhoneOff className="w-4 h-4" />
                )}
                <span>End Call</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function WhatsappCallStatusBadge({
  label,
}: {
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-300">
      <PhoneCall className="w-3 h-3" /> {label}
    </span>
  );
}
