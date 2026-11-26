import { afterEach } from 'vitest';
import { useRNG, setDefaultJoin } from './packages/pattern/index.mjs';

afterEach(() => {
  // Avoid bleed between tests
  useRNG('legacy');
  setDefaultJoin('in');
});
