import playerProfile from './generated/cue/player-profile.cue.js';

export interface ShowcaseFonts {
  level: string;
  numbers: string;
}

/** Case registry: each entry becomes one tab and selects its Cue component. */
export const showcaseCases = [
  {
    id: 'player-profile',
    label: 'Player profile',
    description: 'Lobby identity, level badge, and reactive experience bar',
    component: playerProfile,
  },
];
