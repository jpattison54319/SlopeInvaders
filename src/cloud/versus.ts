/**
 * Matchmaking RPC wrappers + the realtime broadcast channel for live Versus.
 *
 * Matchmaking (open/list/join/finish) is authoritative via the Phase 2 RPCs;
 * live in-match state travels over a Supabase Realtime *broadcast* channel keyed
 * by match id (no table writes per shot). Same account-free model: the student
 * id comes from `identity`, and the RPCs enforce the same-classroom rule.
 */
import type { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabase } from './supabaseClient';
import { getCadetName, getOrCreateStudentId } from './identity';
import type { MatchMessage } from '../game/versus/types';

export interface MatchRow {
  id: string;
  classroom_id: string;
  host_student_id: string;
  host_name: string;
  guest_student_id: string | null;
  guest_name: string | null;
  status: 'open' | 'full' | 'done' | 'cancelled';
  level_seed: number;
  winner_student_id: string | null;
}

export interface OpenMatch {
  id: string;
  host_name: string;
  level_seed: number;
  created_at: string;
}

class CloudDisabledError extends Error {
  constructor() {
    super('Classroom cloud is not configured.');
    this.name = 'CloudDisabledError';
  }
}

export async function createMatch(): Promise<MatchRow> {
  const supabase = getSupabase();
  if (!supabase) throw new CloudDisabledError();
  const { data, error } = await supabase.rpc('create_match', {
    p_student_id: getOrCreateStudentId(),
    p_cadet_name: getCadetName(),
  });
  if (error) throw error;
  return data as MatchRow;
}

export async function listOpenMatches(): Promise<OpenMatch[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc('list_open_matches', {
    p_student_id: getOrCreateStudentId(),
  });
  if (error) return [];
  return (data as OpenMatch[]) ?? [];
}

export async function joinMatch(matchId: string): Promise<MatchRow> {
  const supabase = getSupabase();
  if (!supabase) throw new CloudDisabledError();
  const { data, error } = await supabase.rpc('join_match', {
    p_match_id: matchId,
    p_student_id: getOrCreateStudentId(),
    p_cadet_name: getCadetName(),
  });
  if (error) throw error;
  return data as MatchRow;
}

export async function getMatch(matchId: string): Promise<MatchRow | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('get_match', { p_match_id: matchId });
  if (error) return null;
  return (data as MatchRow | null) ?? null;
}

export async function cancelMatch(matchId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    await supabase.rpc('cancel_match', { p_match_id: matchId, p_student_id: getOrCreateStudentId() });
  } catch {
    /* best-effort */
  }
}

export async function finishMatch(matchId: string, winnerStudentId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    await supabase.rpc('finish_match', { p_match_id: matchId, p_winner_student_id: winnerStudentId });
  } catch {
    /* best-effort */
  }
}

/** A subscribed broadcast channel for one match. */
export interface MatchChannel {
  send: (msg: MatchMessage) => void;
  close: () => void;
}

/** Open + subscribe the realtime channel for a match. `onReady` fires once subscribed. */
export function openMatchChannel(
  matchId: string,
  onMessage: (msg: MatchMessage) => void,
  onReady?: () => void,
): MatchChannel {
  const supabase = getSupabase();
  if (!supabase) {
    return { send: () => {}, close: () => {} };
  }
  const channel: RealtimeChannel = supabase.channel(`match:${matchId}`, {
    config: { broadcast: { self: false } },
  });
  channel.on('broadcast', { event: 'msg' }, ({ payload }) => onMessage(payload as MatchMessage));
  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') onReady?.();
  });
  return {
    send: (msg) => {
      void channel.send({ type: 'broadcast', event: 'msg', payload: msg });
    },
    close: () => {
      void supabase.removeChannel(channel);
    },
  };
}
