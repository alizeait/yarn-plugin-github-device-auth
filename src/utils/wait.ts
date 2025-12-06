import { setTimeout } from 'node:timers/promises';

export function wait(ms: number) {
  return setTimeout(ms);
}
