import type { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabase } from '../../lib/supabaseClient';
import { BattleEventType, type BattleEvent } from './types';

/**
 * Versus transport, over Supabase Realtime.
 *
 * Ported from kanji_go, which had already worked the matchmaking bugs out of
 * it; the comments below record what each accommodation is for, because every
 * one of them is a fix for something that actually broke there.
 *
 * Matchmaking is one flow: everyone who taps "たいせん" waits in a single lobby
 * channel, the two earliest waiters pair up, and the pair moves to its own
 * private channel. Roles are decided from the keys, so there is no room code
 * to type and no host/guest asymmetry for the player.
 */

type EventCallback = (event: BattleEvent) => void;

/** Waiters older than this are ghosts (closed tab, dead network). */
const STALE_WAITER_MS = 30 * 60 * 1000;

/**
 * One lobby for everyone, whatever arc they are on. Splitting it per level
 * made it far too likely nobody was waiting in yours; the question set is
 * reconciled in the handshake instead.
 */
const LOBBY_TOPIC = 'nexmax-kanji-lobby';

/**
 * How long a paired player stays visible in the lobby after deciding. Leaving
 * instantly raced: the faster peer vanished before the slower one had synced
 * the pair, so the slower one never learned the pair code and sat waiting.
 */
const LOBBY_LINGER_MS = 5000;

export class MatchCancelledError extends Error {
  constructor() {
    super('CANCELLED');
    this.name = 'MatchCancelledError';
  }
}

export class RelayUnavailableError extends Error {
  constructor() {
    super('RELAY_UNAVAILABLE');
    this.name = 'RelayUnavailableError';
  }
}

class NetworkManager {
  private static instance: NetworkManager;

  private channel: RealtimeChannel | null = null;
  private lobbyChannel: RealtimeChannel | null = null;
  private lobbyLingerTimer: ReturnType<typeof setTimeout> | null = null;
  private eventCallbacks: EventCallback[] = [];
  private isHost = false;
  private subscribed = false;
  private otherPresent = false;
  private connectionLost = false;
  private myKey: string | null = null;
  private roleDecided = false;
  /** Bumped by cancel() so an in-flight match can never revive. */
  private matchToken = 0;
  /** Waiting for the partner to show up on the pair channel (waitForPartner). */
  private partnerWaiters: Array<() => void> = [];

  private constructor() {}

  public static getInstance(): NetworkManager {
    if (!NetworkManager.instance) NetworkManager.instance = new NetworkManager();
    return NetworkManager.instance;
  }

  // ---- internals --------------------------------------------------------

  private recomputePresence(): void {
    const wasPresent = this.otherPresent;
    const keys = this.channel
      ? Object.keys(this.channel.presenceState()).filter((k) => k.startsWith('p-'))
      : [];
    const others = keys.filter((k) => k !== this.myKey);

    if (!this.roleDecided && this.myKey && others.length > 0) {
      // Smallest key hosts — both peers compute the same answer.
      this.isHost = [...keys].sort()[0] === this.myKey;
      this.roleDecided = true;
    }
    this.otherPresent = others.length > 0;
    if (this.otherPresent && this.partnerWaiters.length) {
      const waiters = this.partnerWaiters;
      this.partnerWaiters = [];
      for (const w of waiters) w();
    }

    if (wasPresent && !this.otherPresent) {
      this.connectionLost = true;
      this.emit({ type: BattleEventType.DISCONNECT, timestamp: Date.now() });
    }
  }

  private emit(event: BattleEvent): void {
    for (const cb of this.eventCallbacks) {
      try {
        cb(event);
      } catch (error) {
        console.error('[versus] event callback threw:', error);
      }
    }
  }

  private attachHandlers(channel: RealtimeChannel): void {
    channel.on('broadcast', { event: 'battle' }, ({ payload }) => this.emit(payload as BattleEvent));
    channel.on('presence', { event: 'sync' }, () => this.recomputePresence());
    channel.on('presence', { event: 'join' }, () => this.recomputePresence());
    channel.on('presence', { event: 'leave' }, () => this.recomputePresence());
  }

  private closeBattleChannel(): void {
    const supabase = getSupabase();
    if (this.channel && supabase) {
      try {
        supabase.removeChannel(this.channel);
      } catch {
        // ignore
      }
    }
    this.channel = null;
    this.subscribed = false;
    this.otherPresent = false;
    this.connectionLost = false;
    this.isHost = false;
    this.myKey = null;
    this.roleDecided = false;
  }

  /**
   * Leave the lobby. This used to leak in kanji_go: the lobby lived in a local
   * variable, so cancelling left it subscribed and a retry subscribed to the
   * same topic twice — which is what made matchmaking stop finding opponents.
   */
  private leaveLobby(): void {
    if (this.lobbyLingerTimer) {
      clearTimeout(this.lobbyLingerTimer);
      this.lobbyLingerTimer = null;
    }
    const supabase = getSupabase();
    if (this.lobbyChannel && supabase) {
      try {
        supabase.removeChannel(this.lobbyChannel);
      } catch {
        // ignore
      }
    }
    this.lobbyChannel = null;
  }

  // ---- public API -------------------------------------------------------

  /**
   * Leave the lobby and the pair channel. The screen's event listeners stay:
   * they belong to the screen (onEvent's unsubscribe). Clearing them here —
   * as kanji_go, whose battle scene subscribes after matchmaking, could —
   * dropped every HANDSHAKE, since this screen listens from the moment it opens.
   */
  public cancel(): void {
    this.matchToken++;
    this.leaveLobby();
    this.closeBattleChannel();
    this.partnerWaiters = [];
  }

  /**
   * Wait in the lobby until someone else is waiting too, then move to a
   * private channel with them.
   *
   * @param onWaiting reports how many are waiting, including you.
   */
  public async findOpponent(opts?: { onWaiting?: (count: number) => void }): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) throw new RelayUnavailableError();

    this.cancel();
    const token = this.matchToken;

    const myKey = `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    // The lobby watcher (watchLobby) holds the same topic, and the client would
    // hand that channel back: let go of it before queueing.
    const stale = supabase.getChannels().find((c) => c.topic === `realtime:${LOBBY_TOPIC}`);
    if (stale) await supabase.removeChannel(stale);
    if (token !== this.matchToken) throw new MatchCancelledError();
    const lobby = supabase.channel(LOBBY_TOPIC, { config: { presence: { key: myKey } } });
    this.lobbyChannel = lobby;

    const partnerKey = await new Promise<string>((resolve, reject) => {
      let settled = false;
      const finish = (fn: () => void) => {
        if (settled) return;
        settled = true;
        fn();
      };

      const check = () => {
        if (settled) return;
        if (token !== this.matchToken) {
          finish(() => reject(new MatchCancelledError()));
          return;
        }
        const state = lobby.presenceState() as Record<string, Array<{ j?: number }>>;
        const now = Date.now();
        const waiters = Object.entries(state)
          .map(([k, v]) => ({ key: k, joined: v[0]?.j ?? 0 }))
          .filter((w) => w.key.startsWith('p-') && w.joined > 0 && now - w.joined < STALE_WAITER_MS)
          // Earliest first; the key breaks ties so both peers agree.
          .sort((a, b) => a.joined - b.joined || (a.key < b.key ? -1 : 1));

        opts?.onWaiting?.(waiters.length);

        if (waiters.length < 2) return;
        const pair = waiters.slice(0, 2);
        if (!pair.some((p) => p.key === myKey)) return; // a pair ahead of us
        const partner = pair.find((p) => p.key !== myKey)!;
        finish(() => resolve(partner.key));
      };

      lobby.on('presence', { event: 'sync' }, check);
      lobby.on('presence', { event: 'join' }, check);
      lobby.on('presence', { event: 'leave' }, check);

      lobby.subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          lobby.track({ j: Date.now() });
          check();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          if (token !== this.matchToken) return; // our own cancellation
          finish(() => reject(err || new Error('つながりませんでした')));
        }
      });
    }).catch((err) => {
      this.leaveLobby();
      throw err;
    });

    if (token !== this.matchToken) {
      this.leaveLobby();
      throw new MatchCancelledError();
    }

    // Linger so the partner reliably observes the same pairing before we go.
    this.lobbyLingerTimer = setTimeout(() => this.leaveLobby(), LOBBY_LINGER_MS);

    const pairCode = [myKey, partnerKey].sort().join('~');
    // The role is settled here, from the lobby keys both sides already agree on:
    // waiting for the pair channel's presence to decide it raced the handshake
    // (neither side yet knew it hosted, so nobody sent the round).
    await this.joinPair(pairCode, token, myKey < partnerKey);
  }

  /**
   * How many are waiting in the lobby right now, for the ロビー to show —
   * without queueing: the watcher's presence key is not a waiter's ('p-'), so
   * it is never counted or paired. Returns a stop.
   */
  public watchLobby(onCount: (n: number) => void): () => void {
    const supabase = getSupabase();
    if (!supabase) return () => {};
    const ch = supabase.channel(LOBBY_TOPIC, { config: { presence: { key: `w-${Math.random().toString(36).slice(2, 10)}` } } });
    const count = () => {
      const now = Date.now();
      const state = ch.presenceState() as Record<string, Array<{ j?: number }>>;
      onCount(Object.entries(state).filter(([k, v]) => k.startsWith('p-') && (v[0]?.j ?? 0) > 0 && now - (v[0]?.j ?? 0) < STALE_WAITER_MS).length);
    };
    ch.on('presence', { event: 'sync' }, count);
    ch.on('presence', { event: 'join' }, count);
    ch.on('presence', { event: 'leave' }, count);
    ch.subscribe((status) => {
      if (status === 'SUBSCRIBED') count();
    });
    return () => {
      void supabase.removeChannel(ch);
    };
  }

  /**
   * ともだちと: meet one friend in a room named by a 4-digit あいことば, no
   * lobby. Whoever made the code hosts; the friend who typed it is the guest.
   */
  public async joinRoom(code: string, host: boolean): Promise<void> {
    this.cancel();
    await this.joinPair(`room-${code}`, this.matchToken, host);
  }

  private async joinPair(pairCode: string, token: number, host: boolean): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) throw new RelayUnavailableError();

    this.closeBattleChannel();
    this.myKey = `p-${Math.random().toString(36).slice(2, 10)}`;
    this.isHost = host;
    this.roleDecided = true;

    // The client hands back a channel it still holds under the same name — a
    // friend's room is entered again for a rematch — so let go of it first.
    const topic = `nexmax-kanji-pair-${pairCode}`;
    const stale = supabase.getChannels().find((c) => c.topic === `realtime:${topic}`);
    if (stale) await supabase.removeChannel(stale);
    if (token !== this.matchToken) throw new MatchCancelledError();

    const channel = supabase.channel(topic, {
      config: { broadcast: { self: false }, presence: { key: this.myKey } },
    });
    this.channel = channel;
    this.attachHandlers(channel);

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('つながるのに 時間が かかりすぎました')), 15000);
      channel.subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          clearTimeout(timeout);
          if (token !== this.matchToken) {
            reject(new MatchCancelledError());
            return;
          }
          this.subscribed = true;
          channel.track({ t: 1 });
          resolve();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          clearTimeout(timeout);
          reject(err || new Error('つながりませんでした'));
        }
      });
    });
  }

  /**
   * Resolves once the partner is on the pair channel (or after `timeoutMs`,
   * with false), so the host does not publish the round into an empty room.
   */
  public waitForPartner(timeoutMs = 10000): Promise<boolean> {
    if (this.otherPresent) return Promise.resolve(true);
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.partnerWaiters = this.partnerWaiters.filter((w) => w !== done);
        resolve(false);
      }, timeoutMs);
      const done = () => {
        clearTimeout(timer);
        resolve(true);
      };
      this.partnerWaiters.push(done);
    });
  }

  public send(event: BattleEvent): void {
    if (!this.channel || !this.subscribed) return;
    this.channel.send({ type: 'broadcast', event: 'battle', payload: event });
  }

  public onEvent(callback: EventCallback): () => void {
    this.eventCallbacks.push(callback);
    return () => {
      this.eventCallbacks = this.eventCallbacks.filter((cb) => cb !== callback);
    };
  }

  public disconnect(): void {
    this.cancel();
  }

  public getStatus(): 'idle' | 'connecting' | 'connected' | 'disconnected' {
    if (!this.channel) return 'idle';
    if (this.connectionLost) return 'disconnected';
    if (this.otherPresent) return 'connected';
    return 'connecting';
  }

  public isHosting(): boolean {
    return this.isHost;
  }
}

export const networkManager = NetworkManager.getInstance();
