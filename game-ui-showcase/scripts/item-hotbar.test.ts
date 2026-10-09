import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createItemHotbar, ItemId } from '../src/cases/item-hotbar/item-hotbar-state.ts';

await test('switching selects without consuming and never resets independent cooldown', () => {
  /// @case Use Laser, switch to Mine during the global lock, then return to Laser.
  /// @expect Inventory is infinite for Laser; only its own mask advances, and switching never
  /// refreshes its deadline.
  const bar = createItemHotbar();
  bar.select(2);
  assert.equal(bar.useSelected(), true);
  assert.equal(bar.slots.value[2].count, undefined);
  assert.equal(bar.slots.value[2].countdown, '3.0');
  bar.select(1);
  assert.equal(bar.slots.value[1].fraction, 0);
  assert.equal(bar.useSelected(), false);
  assert.equal(bar.slots.value[1].count, 5);
  bar.advance(0.2);
  assert.equal(bar.useSelected(), true);
  assert.equal(bar.slots.value[1].count, 4);
  bar.select(2);
  assert.equal(bar.slots.value[2].countdown, '2.8');
  bar.advance(0.5);
  assert.equal(bar.slots.value[1].fraction, 0);
  assert.equal(bar.slots.value[2].countdown, '2.3');
});

await test(('charges recover serially and consuming more does not '
  + 'restart the pending charge'), () => {
  /// @case Empty three Rocket charges 0.2s apart, then advance across several recharge deadlines.
  /// @expect Partial stock shows a soft sweep without digits; zero stock retains its slot and
  /// shows a countdown; recharge caps at three.
  const bar = createItemHotbar();
  bar.useSelected();
  assert.equal(bar.selected.value.count, 2);
  assert.equal(bar.selected.value.soft, true);
  assert.equal(bar.selected.value.countdown, '');
  bar.advance(0.2);
  bar.useSelected();
  bar.advance(0.2);
  bar.useSelected();
  assert.equal(bar.selected.value.count, 0);
  assert.equal(bar.selected.value.soft, false);
  assert.equal(bar.selected.value.countdown, '1.1');
  bar.advance(0.2);
  assert.equal(bar.useSelected(), false);
  bar.advance(0.9);
  assert.equal(bar.selected.value.count, 1);
  assert.equal(bar.selected.value.fraction, 1);
  assert.equal(bar.selected.value.countdown, '');
  bar.advance(20);
  assert.equal(bar.selected.value.count, 3);
  assert.equal(bar.selected.value.fraction, 0);
});

await test(('exhaustion clears a finite stack, selects the first '
  + 'occupied slot and pickup fills the hole'), () => {
  /// @case Spend both Rapidfire uses, try the now-empty slot, then pick up Parachute and stack
  /// Mines.
  /// @expect The empty slot is unselectable; Rocket becomes selected; a different pickup fills
  /// the first hole while same items stack.
  const bar = createItemHotbar();
  bar.select(3);
  bar.useSelected();
  bar.advance(1);
  bar.useSelected();
  const exhaustedSlot = bar.slots.value[3];
  assert.equal(exhaustedSlot.item, undefined);
  assert.equal(bar.selected.value.item?.id, ItemId.rocket);
  assert.equal(bar.select(3), false);
  assert.equal(bar.pickup(ItemId.parachute, 1), true);
  assert.equal(bar.slots.value[3].item?.id, ItemId.parachute);
  assert.equal(bar.pickup(ItemId.mine, 2), true);
  assert.equal(bar.slots.value[1].count, 7);
});

await test('a full bar and duplicate charge item reject pickup without mutating inventory', () => {
  /// @case Try a new item with no empty slot, then another Rocket with partial charges.
  /// @expect Neither pickup overwrites a slot, replenishes charges or resets timers.
  const bar = createItemHotbar();
  assert.equal(bar.pickup(ItemId.parachute, 1), false);
  bar.useSelected();
  bar.advance(0.3);
  const before = structuredClone(
    bar.slots.value.map(({ item, count, fraction }) => ({
      id: item?.id,
      count,
      fraction,
    })),
  );
  assert.equal(bar.pickup(ItemId.rocket, 1), false);
  assert.deepEqual(
    bar.slots.value.map(({ item, count, fraction }) => ({
      id: item?.id,
      count,
      fraction,
    })),
    before,
  );
});

await test('reacquiring an exhausted item preserves its item-specific cooldown', () => {
  /// @case Rapidfire is exhausted then immediately reacquired in its empty slot.
  /// @expect Its old cooldown is still running; a newly occupied slot cannot bypass it.
  const bar = createItemHotbar();
  bar.select(3);
  bar.useSelected();
  bar.advance(1);
  bar.useSelected();
  bar.pickup(ItemId.rapidfire, 2);
  bar.select(3);
  bar.advance(0.2);
  assert.equal(bar.useSelected(), false);
  assert.equal(bar.selected.value.count, 2);
  assert.equal(bar.selected.value.countdown, '0.8');
  bar.advance(0.8);
  assert.equal(bar.useSelected(), true);
});

await test('reset clears both kinds of timer, selection, history and inventory changes', () => {
  /// @case Start a recharge, use a finite item, pick up a stack, then reset the showcase.
  /// @expect The initial loadout is restored immediately with no old cooldown carried into the
  /// next run.
  const bar = createItemHotbar();
  bar.useSelected();
  bar.advance(0.2);
  bar.select(1);
  bar.useSelected();
  bar.pickup(ItemId.mine, 2);
  bar.reset();
  assert.equal(bar.state.now, 0);
  assert.equal(bar.selected.value.item?.id, ItemId.rocket);
  assert.equal(bar.blockedReason.value, '');
  assert.deepEqual(
    bar.slots.value.map((slot) => slot.count),
    [
      3,
      5,
      undefined,
      2,
    ],
  );
  assert.ok(bar.slots.value.every((slot) => slot.fraction === 0));
  assert.equal(bar.state.history.length, 1);
});

export {};
