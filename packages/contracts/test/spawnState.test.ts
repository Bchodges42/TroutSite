import { describe, expect, it } from 'vitest';
import {
  SPAWN_TRANSITION_WINDOW_C,
  SpawnThresholdsSchema,
  spawnStateFor,
  spawnStateLabel,
  spawnStateValue,
  type SpawnThresholds,
} from '../src/index.js';
import { ZodError } from 'zod';

describe('SpawnThresholdsSchema', () => {
  it('accepts an ordered window and rejects onset > end', () => {
    expect(SpawnThresholdsSchema.parse({ onsetC: 12.8, endC: 21.1 })).toBeDefined();
    expect(() => SpawnThresholdsSchema.parse({ onsetC: 21.1, endC: 12.8 })).toThrow(ZodError);
  });
});

describe('spawnStateFor boundaries (smallmouth window 12.8–21.1)', () => {
  const smallmouth: SpawnThresholds = { onsetC: 12.8, endC: 21.1 };

  const cases: Array<[number, string, string]> = [
    [12.8 - SPAWN_TRANSITION_WINDOW_C - 0.1, 'N_A', 'too cold even for the pre-spawn shoulder'],
    [12.8 - SPAWN_TRANSITION_WINDOW_C, 'PRE_SPAWN', 'exactly at the shoulder start'],
    [12.8 - 0.1, 'PRE_SPAWN', 'just below onset'],
    [12.8, 'SPAWNING', 'exactly at onset'],
    [(12.8 + 21.1) / 2, 'SPAWNING', 'mid-window'],
    [21.1, 'SPAWNING', 'exactly at end'],
    [21.1 + 0.1, 'POST_SPAWN', 'just above end'],
    [21.1 + SPAWN_TRANSITION_WINDOW_C, 'POST_SPAWN', 'exactly at the shoulder end'],
    [21.1 + SPAWN_TRANSITION_WINDOW_C + 0.1, 'N_A', 'warmed past post-spawn'],
  ];
  for (const [tempC, expected, why] of cases) {
    it(`${tempC}°C → ${expected} (${why})`, () => {
      expect(spawnStateFor(tempC, smallmouth)).toBe(expected);
    });
  }

  it('is N_A without sourced thresholds (never calendared, never guessed)', () => {
    expect(spawnStateFor(16, null)).toBe('N_A');
  });
});

describe('spawnStateFor properties (seeded, deterministic)', () => {
  function prng(seed: number): () => number {
    let a = seed;
    return () => {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  it('zone map is exhaustive, ordered, and honors the window for any sourced window', () => {
    const rand = prng(20260913);
    for (let i = 0; i < 200; i += 1) {
      const onsetC = 5 + rand() * 15;
      const endC = onsetC + rand() * 8;
      const thresholds: SpawnThresholds = { onsetC, endC };
      const w = SPAWN_TRANSITION_WINDOW_C;
      // Boundaries are exact.
      expect(spawnStateFor(onsetC - w - 0.01, thresholds)).toBe('N_A');
      expect(spawnStateFor(onsetC - w, thresholds)).toBe('PRE_SPAWN');
      expect(spawnStateFor(onsetC, thresholds)).toBe('SPAWNING');
      expect(spawnStateFor(endC, thresholds)).toBe('SPAWNING');
      expect(spawnStateFor(endC + w, thresholds)).toBe('POST_SPAWN');
      expect(spawnStateFor(endC + w + 0.01, thresholds)).toBe('N_A');
      // Deep cold and deep warm are always N_A.
      expect(spawnStateFor(-10, thresholds)).toBe('N_A');
      expect(spawnStateFor(45, thresholds)).toBe('N_A');
    }
  });

  it('the same temperature always maps to the same state, and inputs are untouched', () => {
    const thresholds = Object.freeze({ onsetC: 15.6, endC: 23.9 });
    const before = JSON.stringify(thresholds);
    const a = spawnStateFor(17, thresholds);
    const b = spawnStateFor(17, thresholds);
    expect(a).toBe(b);
    expect(JSON.stringify(thresholds)).toBe(before);
  });
});

describe('spawn activity semantics', () => {
  it('PRE_SPAWN boosts (value > 50), SPAWNING is neutral (50), POST_SPAWN reduces (value < 50)', () => {
    expect(spawnStateValue('PRE_SPAWN')).toBeGreaterThan(50);
    expect(spawnStateValue('SPAWNING')).toBe(50);
    expect(spawnStateValue('POST_SPAWN')).toBeLessThan(50);
    expect(spawnStateValue('N_A')).toBe(50);
  });

  it('the spawning label carries the conservation message', () => {
    expect(spawnStateLabel('SPAWNING', 'smallmouth bass')).toMatch(/On beds — handle and release quickly/);
    expect(spawnStateLabel('PRE_SPAWN', 'smallmouth bass')).toMatch(/pre-spawn/);
    expect(spawnStateLabel('POST_SPAWN', 'smallmouth bass')).toMatch(/post-spawn/);
    expect(spawnStateLabel('N_A', 'bluegill')).toMatch(/none for bluegill/);
  });
});
