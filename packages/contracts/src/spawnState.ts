import type { SpawnState, SpawnThresholds } from './schemas/fishability.js';

/**
 * Temperature-triggered spawn state (F9, contract v2). PURE and deterministic:
 * the state derives ONLY from the observed water temperature against the
 * species' sourced spawning window — never from the calendar (a calendar claim
 * would be a guess; temperature is what actually gates spawning).
 *
 * Transition width: F2 sources the onset/end thresholds, not the approach
 * lanes, so the PRE/POST shoulders are an explicit, documented HEURISTIC
 * (SPAWN_TRANSITION_WINDOW_C) rather than a species claim — the emitted
 * activity row carries confidence 'derived' from measured temperature + cited
 * thresholds, and the window is visible in this constant for review.
 */
export const SPAWN_TRANSITION_WINDOW_C = 4;

export function spawnStateFor(tempC: number, thresholds: SpawnThresholds | null): SpawnState {
  if (!thresholds) return 'N_A';
  const { onsetC, endC } = thresholds;
  const w = SPAWN_TRANSITION_WINDOW_C;
  if (tempC < onsetC - w) return 'N_A';
  if (tempC < onsetC) return 'PRE_SPAWN';
  if (tempC <= endC) return 'SPAWNING';
  if (tempC <= endC + w) return 'POST_SPAWN';
  return 'N_A';
}

/** The activity factor value a spawn state maps to (0–100, 50 = neutral). */
export function spawnStateValue(state: SpawnState): number {
  switch (state) {
    case 'PRE_SPAWN':
      return 80; // pre-spawn: aggressive feeding — boosts the outlook
    case 'SPAWNING':
      return 50; // neutral: conservation, not opportunity
    case 'POST_SPAWN':
      return 30; // post-spawn: exhausted fish — reduces the outlook
    case 'N_A':
      return 50; // outside any spawn window: neutral
  }
}

/** Plain-language label, including the conservation message while on beds. */
export function spawnStateLabel(state: SpawnState, speciesName: string): string {
  switch (state) {
    case 'PRE_SPAWN':
      return `Spawn state: pre-spawn — ${speciesName} are staging and feeding hard`;
    case 'SPAWNING':
      return 'On beds — handle and release quickly';
    case 'POST_SPAWN':
      return `Spawn state: post-spawn — ${speciesName} are recovering, fishing is slower`;
    case 'N_A':
      return `Spawn state: none for ${speciesName} at this temperature`;
  }
}
