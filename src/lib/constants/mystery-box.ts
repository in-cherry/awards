export const MYSTERY_BOX_EMPTY_PRIZE = {
  id: "EMPTY_BOX",
  name: "Caixa Vazia",
  value: 0,
  chance: 0,
  remaining: Number.MAX_SAFE_INTEGER,
} as const;

export const MYSTERY_BOX_CHANCE_BASE = 1.0;

export const MYSTERY_BOX_LEGACY_LOCK_NAME = "[LEGACY_LOCKED_BOX]";
export const MYSTERY_BOX_LEGACY_LOCK_DISPLAY_NAME = "Caixa bloqueada na virada da campanha";
