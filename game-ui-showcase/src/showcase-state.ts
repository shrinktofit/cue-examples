import playerProfile from './cases/player-profile/player-profile.cc.vue';
import itemHotbar from './cases/item-hotbar/item-hotbar.cc.vue';

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
  {
    id: 'item-hotbar',
    label: 'Item hotbar',
    description: 'Four reactive item slots, independent cooldowns, charges and stack counts',
    component: itemHotbar,
  },
];
