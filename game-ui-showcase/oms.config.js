import { cue } from '@bsgames/oms-plugin-cue';
import { defineConfig } from '@oms/plugin';

export default defineConfig({
  plugins: [cue()],
  profiles: {
    headless: { include: [], build: { target: 'node22' } },
  },
});
