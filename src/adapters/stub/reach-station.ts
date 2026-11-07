import type { Connection } from '@/demo/demo-settings';
import { StationUnavailableError } from '@/domain/errors';

const loadingPollMs = 250;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Simulates the network round trip of a stub. While the demo forces loading the answer is held
 * back, and released once the state is switched off, so screens recover without a reload.
 */
export async function reachStation(station: string, delayMs: number, connection: () => Connection) {
  if (delayMs > 0) await wait(delayMs);
  while (connection() === 'loading') await wait(loadingPollMs);
  if (connection() === 'offline') throw new StationUnavailableError(station);
}
