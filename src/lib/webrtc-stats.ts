import type { CallTelemetryPayload } from '@/lib/calls-api';
import type { CallIcePath } from '@/store/call-ui.store';

interface GenericRtcStat {
  id: string;
  type: string;
  selectedCandidatePairId?: string;
  localCandidateId?: string;
  remoteCandidateId?: string;
  nominated?: boolean;
  state?: string;
  candidateType?: string;
  relayProtocol?: string;
  protocol?: string;
  currentRoundTripTime?: number;
  bytesSent?: number;
  bytesReceived?: number;
  kind?: string;
  mediaType?: string;
  packetsLost?: number;
  jitter?: number;
}

/**
 * Inspects RTCPeerConnection.getStats() using ONLY the nominated/selected candidate pair
 * (never merely gathered candidates) so STUN/host/prflx classify as `direct` and only
 * active TURN relay paths classify as `turn_relay`.
 */
export async function extractWebRtcTelemetry(
  pc: RTCPeerConnection,
): Promise<CallTelemetryPayload | null> {
  try {
    const report = await pc.getStats();
    const byId = new Map<string, GenericRtcStat>();
    const pairs: GenericRtcStat[] = [];
    let selectedPairId: string | undefined;

    let inboundPacketsLost = 0;
    let inboundJitterMs = 0;
    let bytesSent = 0;
    let bytesReceived = 0;

    report.forEach((raw) => {
      const stat = raw as unknown as GenericRtcStat;
      byId.set(stat.id, stat);
      if (stat.type === 'transport' && stat.selectedCandidatePairId) {
        selectedPairId = stat.selectedCandidatePairId;
      }
      if (stat.type === 'candidate-pair') {
        pairs.push(stat);
      }
      if (
        stat.type === 'inbound-rtp' &&
        (stat.kind === 'audio' || stat.mediaType === 'audio')
      ) {
        if (typeof stat.packetsLost === 'number') {
          inboundPacketsLost = Math.max(0, stat.packetsLost);
        }
        if (typeof stat.jitter === 'number') {
          inboundJitterMs = Math.max(0, Math.round(stat.jitter * 1000));
        }
        if (typeof stat.bytesReceived === 'number') {
          bytesReceived = Math.max(bytesReceived, stat.bytesReceived);
        }
      }
      if (
        stat.type === 'outbound-rtp' &&
        (stat.kind === 'audio' || stat.mediaType === 'audio')
      ) {
        if (typeof stat.bytesSent === 'number') {
          bytesSent = Math.max(bytesSent, stat.bytesSent);
        }
      }
    });

    const selectedPair =
      (selectedPairId ? byId.get(selectedPairId) : undefined) ||
      pairs.find((p) => p.nominated && p.state === 'succeeded') ||
      pairs.find((p) => p.state === 'succeeded');

    const localCandidate = selectedPair?.localCandidateId
      ? byId.get(selectedPair.localCandidateId)
      : undefined;
    const remoteCandidate = selectedPair?.remoteCandidateId
      ? byId.get(selectedPair.remoteCandidateId)
      : undefined;

    const localType = String(localCandidate?.candidateType || '').trim();
    const remoteType = String(remoteCandidate?.candidateType || '').trim();
    const turnUsed = localType === 'relay' || remoteType === 'relay';

    let relayProtocol = '';
    if (localType === 'relay') {
      relayProtocol = String(
        localCandidate?.relayProtocol || localCandidate?.protocol || '',
      );
    } else if (remoteType === 'relay') {
      relayProtocol = String(
        remoteCandidate?.relayProtocol || remoteCandidate?.protocol || '',
      );
    }

    const rttMs =
      selectedPair && typeof selectedPair.currentRoundTripTime === 'number'
        ? Math.max(0, Math.round(selectedPair.currentRoundTripTime * 1000))
        : 0;

    if (selectedPair) {
      if (typeof selectedPair.bytesSent === 'number') {
        bytesSent = Math.max(bytesSent, selectedPair.bytesSent);
      }
      if (typeof selectedPair.bytesReceived === 'number') {
        bytesReceived = Math.max(bytesReceived, selectedPair.bytesReceived);
      }
    }

    const iceState = pc.iceConnectionState;
    const icePath: CallIcePath =
      iceState === 'failed'
        ? 'failed'
        : turnUsed
          ? 'turn_relay'
          : 'direct';

    return {
      icePath,
      turnUsed,
      localCandidateType: localType,
      remoteCandidateType: remoteType,
      relayProtocol,
      rttMs,
      jitterMs: inboundJitterMs,
      packetsLost: inboundPacketsLost,
      bytesSent,
      bytesReceived,
      iceConnectionState: iceState,
      iceFailureReason:
        iceState === 'failed' ? 'ICE candidate connectivity failed' : '',
    };
  } catch {
    return null;
  }
}
