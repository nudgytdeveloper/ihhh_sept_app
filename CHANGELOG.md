# Changelog

## 2026-06-04

### Added
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
