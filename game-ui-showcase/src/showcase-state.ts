import { computed, ref } from '@bsgames/cue';
import playerProfile from './generated/cue/player-profile.cue.js';

export interface ShowcaseFonts {
  level: string;
  numbers: string;
}

export const showcaseCases = [
  {
    id: 'player-profile',
    label: 'Player profile',
    description: 'Lobby identity, level badge, and reactive experience bar',
    component: playerProfile,
  },
] as const;

export function createShowcaseState() {
  const selectedCase = ref<string>(showcaseCases[0].id);
  const currentCase = computed(() => {
    const selected = showcaseCases.find(entry => entry.id === selectedCase.value);
    if (!selected) {
      throw new Error(`Unknown showcase case: ${selectedCase.value}`);
    }
    return selected;
  });
  const playerName = ref('星际旅行者');
  const level = ref(89);
  const experience = ref(635);
  const experienceMax = 1617;
  const experienceRatio = computed(() => experience.value / experienceMax);
  return {
    selectedCase,
    currentCase,
    playerName,
    level,
    experience,
    experienceMax,
    experienceRatio,
  };
}
