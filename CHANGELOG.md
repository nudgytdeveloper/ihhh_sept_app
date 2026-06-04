# Changelog

## 2026-06-04

### Added
- Screen 5 — Host Game Control Panel (/host): control-room dashboard to start/end the round, spawn mini-virus waves, unleash the COVID Boss with a chosen shape, lock the leaderboard, announce the winner, and push reminders — each with a toast + timestamped activity-log entry
- getHostControls() (status-driven action availability) + getWinner() helpers in src/utils/game.ts
- Host constants in src/constants/host.ts (HOST_REMINDERS presets, LogTone + LOG_TONE_DOT)
- Screen 4 — Virus Fight Game (/game/play): live round with a 3-2-1 intro, tappable mini-viruses (+points) with rising score popups, a live score/rank/countdown HUD, the COVID Boss draw-to-defeat moment, and an end-of-round summary with replay
- Boss shape-detection util (src/utils/shape-detection.ts: matchShape/classifyStroke) — resample + radius-variance + corner-count heuristic, tuned so the asked shape passes shapeMatchThreshold while a dot/line/wrong shape fails
- RoundPhase + BossOutcome enums, GAME_SCRIPTS host copy, and GAME_CONFIG round-timing fields (intro, boss-spawn, virus spawn interval/cap, popup, boss-resolve, low-time threshold)
- getLiveRank + getPlayersBeaten leaderboard helpers in src/utils/game.ts
- .animate-pop-rise score-popup animation (disabled under prefers-reduced-motion)
- Screen 3 — Game Lobby (/game/lobby): game-branded hero with live status + player count, Navi coach bubble, 3-step how-to-play (tap viruses, beat the COVID Boss by drawing a shape, climb the leaderboard), and a sticky status-aware CTA action bar
- GAME_STATUS_META + LOBBY_CTA constants and src/utils/game.ts helpers (getGameStatusMeta, isGameJoinable, isGameOver, getLobbyCtaLabel)
- LOBBY_INTRO host coaching copy for the game lobby
- Screen 2 — Event Schedule / Phase Timeline (/schedule): compact Navi guide + day-at-a-glance progress and a vertical phase timeline (done/current/upcoming) with the current phase emphasized and carrying its Avatar Script Engine CTA
- PhaseProgressState enum, PHASE_STATE_META, and getPhaseState() helper for phase-relative timeline state
- SCHEDULE_INTRO host intro copy for the schedule screen

## 2026-06-03

### Added
- Scaffolded Next.js 16 (App Router, TypeScript, Tailwind v4) project
- Initialized shadcn/ui (radix-nova) with lucide-react and base components
- Branded design tokens: blue/teal/white/purple palette, gradients, glass and soft-shadow utilities, Plus Jakarta Sans / Sora / Geist Mono fonts
- Constants for event phases, statuses, game config, routes, and the rules-based Avatar Script Engine
- Shared types, formatting/event utils, and mock demo data
- Route stubs for the 5 demo screens (Navigator Home, Schedule, Game Lobby, Virus Fight, Host Control Panel)
- CLAUDE.md documenting product direction, modules, demo scope, tech stack, design language, and conventions
- Screen 1 — Attendee Navigator Home: animated avatar host (Navi) with mood-driven expressions, scripted speech bubble + next-action CTA, phase journey timeline, live game preview with leaderboard peek, seat/check-in status, and reminders
- Avatar/ambient motion utilities (float, blink, pulse-ring, sparkle, bob) with prefers-reduced-motion support, plus a Reveal wrapper for staggered section entrances
- Cute mini-virus SVG art for the game preview
