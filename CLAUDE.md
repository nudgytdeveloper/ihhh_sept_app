# IHHH Event Navigator

Event companion app for **IHHH 2026** (a health & wellness summit happening in
September 2026). Client demo target: **~mid-June 2026** (≈2 weeks out from
project start in early June).

> This is **not** an AI chatbot. It is an **event host / navigator** — a smart
> avatar that proactively guides each attendee through the event — plus a
> built-in **multiplayer game** the IHHH client requested.

---

## Product direction (read this first)

- Positioned as the **"IHHH Event Navigator"**: a smart avatar host that acts
  like an event MC/guide, **not** an "ask-me-anything" assistant.
- **No chat-first UX.** No big chat box, no "Ask AI" button. The **avatar speaks
  first** and gives a **clear next action**.
- The avatar is **proactive and phase-driven** (welcome → complete check-in →
  seat ready → game starting → buffet time → return to hall → closing).
- For the demo, the avatar is **rules-based** — an **"Avatar Script Engine"**
  driven by event phase, time, host action, user status, and game status.
  Full AI can come later.
- The avatar host has a friendly name: **Navi** (`AVATAR_NAME`).

When in doubt: the avatar leads, the attendee follows a single obvious CTA.

---

## Core modules

1. **Attendee Event Navigator** (main screen) — avatar host, current phase,
   next-action card, schedule timeline, seat/registration status, game session
   entry, reminders.
2. **Avatar Host Experience** — phase-based scripted messages (the Script Engine).
3. **Virus Fight Game** — multiplayer: tap cute mini-viruses for points, live
   score + leaderboard, countdown timer. **Boss mechanic:** the host spawns a
   **"COVID boss"**, the attendee **draws a shape** (circle/star/triangle/square)
   to defeat it for bonus points. Shape detection should be **simple/convincing
   for the demo, not perfect**.
4. **Host Control Panel** — start/end game, spawn mini-virus wave, spawn boss +
   select required shape, lock leaderboard, view live leaderboard, announce
   winner, push reminders.

---

## Event phases

```
Registered → Seated → Opening → Game Session → Buffet → Closing
```

Defined in `src/constants/phases.ts` as the `EventPhase` enum + `PHASE_ORDER` +
`PHASE_META` (label, time, icon, accent classes). The Script Engine and the
schedule timeline are both driven by the current `EventPhase`.

---

## Demo scope — 5 screens only

**Do NOT build all 10 modules yet.** The demo is exactly these 5 screens:

| # | Screen | Route | Status |
|---|--------|-------|--------|
| 1 | Attendee Navigator Home | `/` | ✅ built |
| 2 | Event Schedule / Phase Timeline | `/schedule` | ✅ built |
| 3 | Game Lobby | `/game/lobby` | ✅ built |
| 4 | Virus Fight Game | `/game/play` | ⏳ scaffolded |
| 5 | Host Game Control Panel | `/host` | ⏳ scaffolded |

Routes are centralized in `src/constants/routes.ts` (`ROUTES`).

**Screen 1 is the priority** — it defines the whole product direction, so it
should be the most polished. For Screen 1, show only the **game preview / entry
point** — do **not** build the game UI there.

---

## Tech stack (installed)

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Tailwind CSS v4** (CSS-first config via `@theme` in `globals.css`)
- **shadcn/ui** (style: `radix-nova`) — components in `src/components/ui`
- **lucide-react** icons
- **sonner** for toasts (`<Toaster>` mounted in root layout)
- Game rendering: **HTML Canvas or animated DOM elements** (TBD per screen)
- Realtime / leaderboard: **Firebase / Supabase / Socket.io — TBD.** Mock data
  is used for the demo (see `src/data/`). Visual polish > backend completeness.
- Voice: optional; **text bubble first**.

### Commands

```bash
npm run dev      # start dev server (Turbopack)
npm run build    # production build + typecheck
npm run lint     # eslint
npx shadcn@latest add <component>   # add a shadcn/ui component
```

---

## Design language

Premium, modern **enterprise event-app** feel (healthcare / conference) that is
**playful and relaxed while still looking professional**. Cards, soft gradients,
subtle shadows, rounded corners. **Mobile-first**, responsive up to desktop.
Production-ready look, not wireframe.

**Palette** (defined as tokens in `src/app/globals.css`):

- Primary: **modern blue** (`--primary` / `bg-brand-blue`)
- Accent: **teal** (`--brand-teal`)
- **White** surfaces
- Subtle **purple** accent (`--brand-purple`)
- Supporting: sky, amber, indigo, rose (per-phase accents + charts)

**Reusable design helpers** (in `globals.css`):

- `.bg-app-ambient` — soft multi-radial backdrop for attendee screens
- `.bg-brand-gradient` / `.bg-brand-gradient-cool` — hero/button gradients
- `.text-gradient-brand` — gradient text
- `.glass` — frosted glass surface (headers, floating bars)
- `.shadow-soft` / `.shadow-soft-lg` — premium soft elevation
- Brand color utilities: `text-/bg-brand-blue|brand-teal|brand-purple|brand-sky`,
  plus `success` / `warning`
- Fonts: **Plus Jakarta Sans** (`font-sans`), **Sora** (`font-heading`,
  auto-applied to `h1–h5`), **Geist Mono** (`font-mono`, great for timers/scores)
- Radius is generous (`--radius: 0.9rem`) for the soft, rounded, playful feel
- Motion: `.animate-float` / `.animate-blink` / `.animate-pulse-ring` /
  `.animate-sparkle` / `.animate-bob` (avatar + ambient), all disabled under
  `prefers-reduced-motion`; `<Reveal>` wraps sections for staggered entrances

---

## Project structure & conventions

```
src/
├─ app/
│  ├─ layout.tsx              # root: fonts, metadata, TooltipProvider, Toaster
│  ├─ globals.css             # design tokens + brand utilities
│  ├─ (attendee)/             # attendee shell (ambient bg, branded header)
│  │  ├─ layout.tsx
│  │  ├─ page.tsx             # Screen 1 — Navigator Home  (/)
│  │  ├─ schedule/page.tsx    # Screen 2  (/schedule)
│  │  └─ game/
│  │     ├─ lobby/page.tsx    # Screen 3  (/game/lobby)
│  │     └─ play/page.tsx     # Screen 4  (/game/play)
│  └─ host/
│     ├─ layout.tsx           # host control-room shell
│     └─ page.tsx             # Screen 5  (/host)
├─ components/
│  ├─ ui/                     # shadcn/ui primitives
│  └─ scaffold/               # dev placeholders (ScreenStub)
├─ constants/                 # ⚠️ all enums & literals live here (see rules)
│  ├─ app.ts                  # app/event identity + AVATAR_NAME
│  ├─ routes.ts               # ROUTES
│  ├─ statuses.ts             # RegistrationStatus, SeatStatus, AvatarMood, ActionIntent
│  ├─ phases.ts               # EventPhase, PHASE_ORDER, PHASE_META, PhaseProgressState
│  ├─ game.ts                 # GameStatus, BossShape, SHAPE_META, GAME_CONFIG, GAME_STATUS_META
│  ├─ avatar-scripts.ts       # AVATAR_SCRIPTS + SCHEDULE_INTRO/LOBBY_INTRO (Script Engine)
│  └─ index.ts                # barrel
├─ utils/                     # ⚠️ all reusable functions live here (see rules)
│  ├─ format.ts               # formatCountdown, formatScore, getInitials, template
│  ├─ event.ts                # phase helpers (getPhaseState…) + getAvatarScript
│  ├─ game.ts                 # game status helpers (getGameStatusMeta, getLobbyCtaLabel…)
│  └─ index.ts                # barrel
├─ lib/
│  └─ utils.ts                # shadcn `cn()` helper ONLY (ecosystem convention)
├─ types/
│  └─ index.ts                # shared TS types (Attendee, ScheduleItem, GameSession, …)
└─ data/
   └─ event.ts                # mock demo data (attendee, schedule, leaderboard, state)
```

### Repo rules (from global `~/.claude/CLAUDE.md`) — follow exactly

- **CHANGELOG.md**: after any behavior change, append an entry at the **top** of
  `CHANGELOG.md` (date-grouped; sections Added/Fixed/Changed/Removed; omit empty
  sections; no prose).
- **Centralize reusable functions in `/utils`** (`src/utils`). Exception: the
  shadcn `cn()` helper stays at `@/lib/utils` because every shadcn component
  imports it from there.
- **Never compare raw strings or integers** — use enums/constants from
  `src/constants` (e.g. `EventPhase`, `GameStatus`, `BossShape`, `ROUTES`,
  `GAME_CONFIG`).

### Working notes

- The Avatar Script Engine is currently `AVATAR_SCRIPTS[phase]` (see
  `getAvatarScript()` in `src/utils/event.ts`). Copy supports a `{name}` token —
  personalize it with `template()` from `src/utils/format.ts`.
- The demo `MOCK_EVENT_STATE` is set to the **Game Session** phase so the home
  screen naturally surfaces the game entry point.
- `ScreenStub` (`src/components/scaffold`) is a temporary placeholder; replace
  each screen's stub with the real UI as it's built.

---

## Screen 1 — built

**Attendee Navigator Home** is implemented at `src/app/(attendee)/page.tsx`,
composed from `src/components/navigator/`:

- `avatar-host.tsx` — Navi, the animated SVG mascot (mood-driven via the Script Engine)
- `navigator-hero.tsx` — avatar + scripted speech bubble + single next-action CTA
- `phase-progress.tsx` — event-journey track with Now / Up next callouts
- `game-preview-card.tsx` — live game **entry point** + leaderboard peek (not the game itself)
- `status-card.tsx` — check-in + seat
- `reminders-card.tsx` — proactive reminders
- `reveal.tsx` — staggered entrance wrapper

Supporting art: `src/components/game/mini-virus.tsx`. The page reads from
`src/data/event.ts` (mock), defaulting to the Game Session phase.

## Screen 2 — built

**Event Schedule / Phase Timeline** is implemented at
`src/app/(attendee)/schedule/page.tsx`, composed from `src/components/schedule/`:

- `schedule-overview.tsx` — compact Navi guide + day-at-a-glance progress
  ("Phase n of N", current phase, progress bar)
- `schedule-timeline.tsx` — vertical phase timeline; each row's state comes from
  `getPhaseState()` (`PhaseProgressState`: Done / Current / Next / Upcoming),
  with labels from `PHASE_STATE_META`. The current phase is emphasized and
  carries the single CTA, pulled from the Script Engine so the timeline and the
  host stay in sync.

Reads `MOCK_SCHEDULE` + `PHASE_META`; reuses `AvatarHost` and `Reveal` from
`src/components/navigator/`. Verified mobile (430px) + desktop with no overflow.

## Screen 3 — built

**Game Lobby** is implemented at `src/app/(attendee)/game/lobby/page.tsx`,
composed from `src/components/game/`:

- `lobby-hero.tsx` — game banner: status pill, floating mini-viruses, and a
  "who's in" player count with stacked avatars
- `lobby-coach.tsx` — compact Navi coaching the attendee before the round
- `how-to-play.tsx` — 3 rules (tap viruses → beat the COVID Boss by drawing a
  shape → climb the leaderboard); numbers from `GAME_CONFIG`, shapes from
  `SHAPE_META`
- a sticky glass action bar with the single status-aware CTA

Game state is driven by `GameStatus` via `GAME_STATUS_META` + the
`src/utils/game.ts` helpers (`getGameStatusMeta`, `isGameJoinable`,
`getLobbyCtaLabel`). Reuses `AvatarHost`, `MiniVirus`, and `Reveal`. Verified
mobile (430px) + desktop with no overflow.

## Next step

**Screen 4 — Virus Fight Game** (`/game/play`): the live round — tappable
mini-viruses scoring `pointsPerVirus`, a `roundSeconds` countdown, live score,
and the **COVID Boss** moment where the attendee draws a shape (circle / star /
triangle / square) to defeat it for `bossBonusPoints`. Shape detection should be
**simple/convincing for the demo, not perfect**. Then the Host Control Panel
(Screen 5).
