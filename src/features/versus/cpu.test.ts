import { describe, expect, it } from 'vitest';
import { CPU_LEVELS, cpuPace, cpuTurn, type CpuLevel } from './cpu';
import { VS_MAX_HP, writeDamage } from './rules';

/** A fixed sequence of "random" numbers. */
const seq = (xs: number[]) => {
  let i = 0;
  return () => xs[i++ % xs.length];
};

describe('the CPU of たいせん', () => {
  it('writes at a learner’s pace, a little faster for stronger players', () => {
    expect(cpuPace(1000)).toBe(8);
    expect(cpuPace(1400)).toBeLessThan(cpuPace(1000));
    expect(cpuPace(3000)).toBe(5.5);
    expect(cpuPace(800)).toBeLessThanOrEqual(9);
  });

  it('lands nothing on a three-slip character', () => {
    expect(cpuTurn(1000, seq([0.5, 0.99])).damage).toBe(0);
    expect(cpuTurn(1000, seq([0.5, 0.1])).damage).toBe(writeDamage(0, false, 1));
  });

  it('can be beaten by writing clean at an ordinary speed', () => {
    // Average time the CPU needs to empty a full HP bar, over many draws.
    let rnd = 1;
    const random = () => ((rnd = (rnd * 16807) % 2147483647) - 1) / 2147483646;
    let ms = 0;
    let hp = VS_MAX_HP;
    let fights = 0;
    let total = 0;
    while (fights < 200) {
      const t = cpuTurn(1000, random);
      ms += t.ms;
      hp -= t.damage;
      if (hp <= 0) {
        total += ms;
        fights += 1;
        ms = 0;
        hp = VS_MAX_HP;
      }
    }
    const cpuSeconds = total / fights / 1000;
    // A player writing every 6 s, clean, bare-handed:
    const playerSeconds = Math.ceil(VS_MAX_HP / writeDamage(0, false, 1)) * 6;
    expect(cpuSeconds).toBeGreaterThan(playerSeconds);
    expect(cpuSeconds).toBeLessThan(playerSeconds * 2);
  });
});

describe('the CPU’s levels', () => {
  /** Average seconds a level needs to empty a full HP bar. */
  const secondsToWin = (level: CpuLevel) => {
    let seed = 7;
    const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    let total = 0;
    for (let f = 0; f < 300; f++) {
      let hp = VS_MAX_HP;
      while (hp > 0) {
        const t = cpuTurn(1000, random, level);
        total += t.ms;
        hp -= t.damage;
      }
    }
    return total / 300 / 1000;
  };

  it('gets faster from やさしい to つよい, with ふつう as it always was', () => {
    const [easy, normal, hard] = ([0, 1, 2] as const).map(secondsToWin);
    expect(easy).toBeGreaterThan(normal);
    expect(normal).toBeGreaterThan(hard);
    expect(cpuTurn(1000, () => 0.5)).toEqual(cpuTurn(1000, () => 0.5, 1));
  });

  it('leaves even つよい beatable by clean writing at a good pace', () => {
    const playerSeconds = Math.ceil(VS_MAX_HP / writeDamage(0, false, 1)) * 4;
    expect(secondsToWin(2)).toBeGreaterThan(playerSeconds);
  });

  it('gives each level a なかま of its own', async () => {
    const { getIndividual } = await import('../../data/individuals');
    for (const l of CPU_LEVELS) expect(getIndividual(l.avatar), l.name).toBeDefined();
    expect(new Set(CPU_LEVELS.map((l) => l.avatar)).size).toBe(3);
  });
});
