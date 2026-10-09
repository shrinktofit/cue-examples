// The smoke tests import the same .cue sources as the scene, through OMS.
await import('../scripts/smoke.ts');
await import('../scripts/control-smoke.ts');
await import('../scripts/control-plane-smoke.ts');

export {};
