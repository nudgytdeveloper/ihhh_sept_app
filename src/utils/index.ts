/**
 * Barrel export for app utilities.
 *
 * Note: the shadcn `cn()` class-merge helper lives at `@/lib/utils` (ecosystem
 * convention used by every shadcn component). All other app-specific reusable
 * functions belong here under `/utils`.
 */
export * from "./format";
export * from "./event";
export * from "./game";
export * from "./shape-detection";
export * from "./realtime";
export * from "./use-game-channel";
export * from "./navi-voice";
export * from "./player-identity";
