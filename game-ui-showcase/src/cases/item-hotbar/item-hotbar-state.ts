import { computed, reactive } from '@bsgames/cue';

// Erasable enum form: the same case module runs in Node's strip-only TS loader.
export const ItemId = {
  rocket: 'rocket',
  mine: 'mine',
  laser: 'laser',
  rapidfire: 'rapidfire',
  parachute: 'parachute',
} as const;
export type ItemId = (typeof ItemId)[keyof typeof ItemId];

interface ItemDefinition {
  name: string;
  icon: string;
  cooldown: number;
  charge?: { max: number; duration: number };
}

// Copied from RoboTimes' items table, not a runtime
// dependency on the game. Durations are seconds of the showcase match clock.
export const hotbarItems: Record<ItemId, ItemDefinition> = {
  [ItemId.rocket]: {
    name: '火箭',
    icon: 'uuid:146aea33-f577-47d0-9922-c831597049c7@f9941',
    cooldown: 0,
    charge: { max: 3, duration: 1.5 },
  },
  [ItemId.mine]: {
    name: '地雷',
    icon: 'uuid:43c3834e-d55f-4ce4-94d5-1d7e83617d0e@f9941',
    cooldown: 0.5,
  },
  [ItemId.laser]: {
    name: '激光炮',
    icon: 'uuid:dccd5c46-3791-4aff-a329-f8ac76135b81@f9941',
    cooldown: 3,
  },
  [ItemId.rapidfire]: {
    name: '连环火箭',
    icon: 'uuid:5b49dd45-a10d-4c1a-9d65-110f917fdb81@f9941',
    cooldown: 1,
  },
  [ItemId.parachute]: {
    name: '降落伞',
    icon: 'uuid:47e5ea42-9e2d-42d2-b125-b58b0e5eaaa5@f9941',
    cooldown: 1,
  },
};

interface ItemStack {
  id: ItemId;
  count?: number;
}
interface ItemUse {
  cooldownEndsAt: number;
  available: number;
  nextChargeAt: number;
}
const timeEpsilon = 1e-9;

/** Standalone local match state; no project server, combat or replication. */
export function createItemHotbar() {
  const uses: Partial<Record<ItemId, ItemUse>> = {};
  const state = reactive({
    now: 0,
    selected: 0,
    globalCooldownEndsAt: 0,
    slots: [] as Array<ItemStack | undefined>,
    uses,
    notice: '',
    history: [] as string[],
  });

  function report(message: string): void {
    state.notice = message;
    state.history.unshift(`${state.now.toFixed(1)}s  ${message}`);
    state.history.splice(3);
  }

  function putItem(index: number, id: ItemId, count?: number): void {
    const definition = hotbarItems[id];
    state.uses[id] ??= {
      cooldownEndsAt: 0,
      available: definition.charge?.max ?? 0,
      nextChargeAt: 0,
    };
    state.slots[index] = { id, count: definition.charge ? undefined : count };
  }

  function reset(): void {
    state.now = 0;
    state.selected = 0;
    state.globalCooldownEndsAt = 0;
    state.uses = {};
    state.slots = Array.from({ length: 4 }, () => undefined);
    state.history = [];
    putItem(0, ItemId.rocket);
    putItem(1, ItemId.mine, 5);
    putItem(2, ItemId.laser);
    putItem(3, ItemId.rapidfire, 2);
    report('装备就绪 · 点击槽位切换道具');
  }

  function advance(seconds: number): void {
    state.now += seconds;
    for (const [id, use] of Object.entries(state.uses)) {
      const charge = hotbarItems[id as ItemId].charge;
      if (!charge) {
        continue;
      }
      while (use.available < charge.max && use.nextChargeAt - state.now <= timeEpsilon) {
        use.available++;
        use.nextChargeAt
          = use.available < charge.max ? use.nextChargeAt + charge.duration : 0;
      }
    }
  }

  function select(index: number): boolean {
    const item = state.slots[index];
    if (!item) {
      return false;
    }
    state.selected = index;
    report(`切换至 ${hotbarItems[item.id].name}`);
    return true;
  }

  const slots = computed(() =>
    state.slots.map((item, index) => {
      if (!item) {
        return {
          index,
          selected: index === state.selected,
          name: '空槽',
          fraction: 0,
          soft: false,
          countdown: '',
          count: undefined,
          item: undefined,
        };
      }
      const definition = hotbarItems[item.id];
      const use = state.uses[item.id]!;
      const cooldown = Math.max(0, use.cooldownEndsAt - state.now);
      const recharging = definition.charge && use.available < definition.charge.max;
      const recharge = recharging ? Math.max(0, use.nextChargeAt - state.now) : 0;
      const soft = cooldown <= timeEpsilon && !!recharging && use.available > 0;
      const countdown
        = cooldown > timeEpsilon
          ? cooldown
          : recharging && use.available === 0
            ? recharge
            : 0;
      const fraction
        = cooldown > timeEpsilon
          ? cooldown / definition.cooldown
          : recharging
            ? recharge / definition.charge!.duration
            : 0;
      return {
        index,
        item,
        selected: index === state.selected,
        name: definition.name,
        count: definition.charge ? use.available : item.count,
        fraction: Math.min(1, fraction),
        soft,
        countdown:
          countdown > timeEpsilon
            ? (Math.ceil(countdown * 10 - timeEpsilon) / 10).toFixed(1)
            : '',
      };
    }),
  );

  const selected = computed(() => slots.value[state.selected]);
  const blockedReason = computed(() => {
    const item = selected.value.item;
    if (!item) {
      return '当前槽位为空';
    }
    if (state.globalCooldownEndsAt - state.now > timeEpsilon) {
      return '全局使用间隔 0.2s';
    }
    const use = state.uses[item.id]!;
    if (use.cooldownEndsAt - state.now > timeEpsilon) {
      return '道具冷却中';
    }
    if (hotbarItems[item.id].charge && use.available === 0) {
      return '等待充能';
    }
    return '';
  });

  function useSelected(): boolean {
    if (blockedReason.value) {
      report(blockedReason.value);
      return false;
    }
    const item = selected.value.item!;
    const definition = hotbarItems[item.id];
    const use = state.uses[item.id]!;
    state.globalCooldownEndsAt = state.now + 0.2;
    use.cooldownEndsAt = state.now + definition.cooldown;
    if (definition.charge) {
      use.available--;
      if (use.nextChargeAt === 0) {
        use.nextChargeAt = state.now + definition.charge.duration;
      }
    } else if (item.count !== undefined) {
      item.count--;
      if (item.count === 0) {
        state.slots[state.selected] = undefined;
        state.selected = Math.max(
          0,
          state.slots.findIndex((slot) => slot !== undefined),
        );
      }
    }
    report(`使用 ${definition.name}${item.count === 0 ? ' · 已耗尽，自动切换' : ''}`);
    return true;
  }

  function pickup(id: ItemId, count: number): boolean {
    const definition = hotbarItems[id];
    const existing = state.slots.find((slot) => slot?.id === id);
    if (definition.charge && existing) {
      report(`${definition.name} 已装备，不能重复拾取`);
      return false;
    }
    if (existing?.count !== undefined) {
      existing.count += count;
    } else {
      const empty = state.slots.findIndex((slot) => slot === undefined);
      if (empty < 0) {
        report('道具栏已满');
        return false;
      }
      putItem(empty, id, count);
    }
    report(`拾取 ${definition.name} ×${count}`);
    return true;
  }

  reset();
  return {
    state,
    slots,
    selected,
    blockedReason,
    advance,
    select,
    useSelected,
    pickup,
    reset,
  };
}

export {};
