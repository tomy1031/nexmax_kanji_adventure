import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { VERSUS_ANON_KEY, VERSUS_URL, isVersusConfigured } from './versusConfig';

describe('versus relay (2026-10-03「kanjigo と 同じ 環境を 使って いい」)', () => {
  it('is on without any build setting, on kanji_go’s project', () => {
    expect(isVersusConfigured).toBe(true);
    expect(VERSUS_URL).toBe('https://iyceaspukufevktabmvy.supabase.co');
    // The public anon key of that same project.
    const payload = JSON.parse(Buffer.from(VERSUS_ANON_KEY.split('.')[1], 'base64url').toString());
    expect(payload).toMatchObject({ ref: 'iyceaspukufevktabmvy', role: 'anon' });
  });

  it('waits in a lobby of its own, so kanji_go’s players are never paired with this game’s', () => {
    const src = readFileSync('src/features/versus/NetworkManager.ts', 'utf8');
    const topic = src.match(/LOBBY_TOPIC = '([^']+)'/)?.[1];
    expect(topic).toBeTruthy();
    expect(topic).not.toBe('kanjigo-lobby-all');
  });
});
