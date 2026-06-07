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
| 4 | Virus Fight Game | `/game/play` | ✅ built |
| 5 | Host Game Control Panel | `/host` | ✅ built |

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
- Realtime: wired for the demo over the browser-native **BroadcastChannel**
  (`src/utils/realtime.ts` `GameChannel` + `useGameChannel`) — the Host panel
  drives the attendee game **live across tabs/windows**, zero backend. The
  transport is abstracted behind `GameChannel`, so Socket.io / Supabase Realtime
  can replace it later without touching screens. The **leaderboard is shared +
  live** — server-aggregated from every attendee's reported score (the mock in
  `src/data/` is only a solo-play rank fallback). Visual polish > backend
  completeness.
- Voice: **Navi speaks** her scripted lines via the Web Speech API — opt-in
  speaker toggle, **off by default** (the text bubble still leads). See
  `src/utils/navi-voice.ts`.

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
  `.animate-sparkle` / `.animate-bob` / `.animate-pop-rise` (avatar + ambient +
  game score popups), all disabled under `prefers-reduced-motion`; `<Reveal>`
  wraps sections for staggered entrances

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
│  ├─ host/
│  │  ├─ layout.tsx           # host control-room shell
│  │  └─ page.tsx             # Screen 5  (/host)
│  └─ api/game/               # realtime SSE endpoints (server route handlers)
│     ├─ stream/route.ts      # SSE stream — host + attendees subscribe (state + leaderboard)
│     └─ publish/route.ts     # host POSTs state/reminders; attendees POST scores (fan-out)
├─ components/
│  ├─ ui/                     # shadcn/ui primitives
│  └─ scaffold/               # dev placeholders (ScreenStub)
├─ constants/                 # ⚠️ all enums & literals live here (see rules)
│  ├─ app.ts                  # app/event identity + AVATAR_NAME
│  ├─ routes.ts               # ROUTES
│  ├─ statuses.ts             # RegistrationStatus, SeatStatus, AvatarMood, ActionIntent
│  ├─ phases.ts               # EventPhase, PHASE_ORDER, PHASE_META, PhaseProgressState
│  ├─ game.ts                 # GameStatus, BossShape, SHAPE_META, GAME_CONFIG, GAME_STATUS_META, RoundPhase, BossOutcome
│  ├─ avatar-scripts.ts       # AVATAR_SCRIPTS + SCHEDULE_INTRO/LOBBY_INTRO/GAME_SCRIPTS (Script Engine)
│  ├─ host.ts                 # HOST_REMINDERS, LogTone + LOG_TONE_DOT (host panel)
│  ├─ realtime.ts             # REALTIME_CHANNEL, RealtimeMessage (State/Reminder/Score/Leaderboard), paths
│  ├─ voice.ts                # VOICE_CONFIG, VOICE_PREF, VOICE_STORAGE_KEY (Navi voice)
│  ├─ player.ts               # player identity: storage keys + handle word pools
│  └─ index.ts                # barrel
├─ utils/                     # ⚠️ all reusable functions live here (see rules)
│  ├─ format.ts               # formatCountdown, formatScore, getInitials, template
│  ├─ event.ts                # phase helpers (getPhaseState…) + getAvatarScript
│  ├─ game.ts                 # game/leaderboard/host helpers (getGameStatusMeta, getLiveRank, toLeaderboard, getRankAmong, getHostControls…)
│  ├─ shape-detection.ts      # boss draw-to-defeat matcher (matchShape / classifyStroke)
│  ├─ realtime.ts             # GameChannel — SSE / BroadcastChannel transport facade (swappable)
│  ├─ use-game-channel.ts     # useGameChannel hook (publish state/score/reminder + subscribe)
│  ├─ navi-voice.ts           # Web Speech API — speakLine + useNaviVoice store
│  ├─ player-identity.ts      # per-device identity (usePlayerIdentity — useSyncExternalStore)
│  └─ index.ts                # barrel
├─ lib/
│  └─ utils.ts                # shadcn `cn()` helper ONLY (ecosystem convention)
├─ server/                    # ⚠️ server-only (never imported by client / barrel)
│  └─ game-hub.ts             # in-memory SSE pub/sub hub: host state + subscribers + aggregated leaderboard
├─ types/
│  └─ index.ts                # shared TS types (Attendee, ScheduleItem, GameSession, GameSessionState, ScoreEntry, …)
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

## Screen 4 — built

**Virus Fight Game** is implemented at `src/app/(attendee)/game/play/page.tsx`
(a thin server component that exports `metadata` and renders the client game),
composed from `src/components/game/`:

- `virus-fight-game.tsx` — **`"use client"`** orchestrator. A `RoundPhase` state
  machine: `Intro` (3-2-1-GO countdown) → `Active` (tap mini-viruses) → `Boss`
  (draw the shape) → back to `Active` → `Ended` (summary). The round clock pauses
  during the boss fight; all transitions fire from timer callbacks (refs as the
  live source of truth) — no `setState` in effect bodies.
- `game-hud.tsx` — live score, `getLiveRank()` standing, countdown (turns urgent
  at `lowTimeThresholdSeconds`) + time-progress bar
- `tappable-virus.tsx` — a single floating `MiniVirus` button (`ActiveVirus`);
  pop = `+pointsPerVirus` and an `.animate-pop-rise` score popup
- `boss-virus.tsx` — the crowned COVID Boss art
- `boss-fight.tsx` — **`"use client"`** draw surface: pointer-stroke capture +
  live polyline + target guide + boss timer; calls `matchShape()` and reports a
  defeat to the parent (which awards `bossBonusPoints`). Parent owns the escape
  (timeout). Result flourishes driven by `BossOutcome`.
- `game-intro.tsx` / `round-summary.tsx` — Navi-led get-ready + end-of-round overlays

Shape detection lives in `src/utils/shape-detection.ts` (`matchShape`,
`classifyStroke`) — a resample + cvR-band + corner-count heuristic, tuned so a
cooperative attempt at the asked shape passes `GAME_CONFIG.shapeMatchThreshold`
(0.7) while a dot/line/wrong shape fails: **simple/convincing, not perfect**.
Verified end-to-end in headless Chrome (circle/triangle/square defeats) across
all phases at mobile (430px) + desktop with no overflow.

## Screen 5 — built

**Host Game Control Panel** is implemented at `src/app/host/page.tsx` (a thin
server component that exports `metadata` and renders the client panel), composed
from `src/components/host/`:

- `host-control-panel.tsx` — **`"use client"`** orchestrator. Owns the session
  state and drives `GameStatus` via `getHostControls()` (which actions are
  available per status). Each action fires a `sonner` toast + an activity-log
  entry. Renders the waves + reminders cards inline.
- `host-status-banner.tsx` — "now playing" bar: current `GameStatus`
  (`GAME_STATUS_META`) + player/wave/boss stats + flow controls (Start / End /
  Reset), enabled per status
- `boss-control.tsx` — pick a `BossShape` and unleash the boss (Active →
  BossActive); "Resume round" sends it away
- `host-leaderboard.tsx` — live leaderboard (medals + current-user highlight),
  Lock toggle, and Announce winner (crowns `getWinner()` with a 🏆 badge)
- `host-activity-log.tsx` — timestamped feed of recent actions (newest first,
  capped), tone-colored via `LOG_TONE_DOT`

Reads `MOCK_EVENT_STATE` + `MOCK_LEADERBOARD`. Uses the wider control-room shell
at `src/app/host/layout.tsx` (`max-w-5xl`, no ambient gradient). Verified
end-to-end in headless Chrome (full Lobby → Active → Boss → Ended → Locked flow,
winner announce, reminder toasts) at mobile (430px) + desktop with no overflow.

## Realtime sync + Navi voice — wired

Three post-demo extensions are now in place (realtime host→attendee control, a
shared live leaderboard, and Navi voice).

**Realtime (host drives attendees live, cross-device).** Screen 5 (`/host`) and
Screen 4 (`/game/play`) sync over **Server-Sent Events** served by the app
itself, so attendees on **any device / network** join over the public URL — runs
on a **single server instance** (Render-ready), no third-party realtime service:

- `src/server/game-hub.ts` — server-only in-memory hub: holds the latest host
  `GameSessionState` + the set of connected SSE clients, fanning host updates out
  to all of them. **Deliberately not under `/utils`** (that barrel is imported by
  client components — this must never reach the client bundle). Single-instance;
  swap the `Set`/state for Redis pub/sub if the Render service is ever scaled out.
- `src/app/api/game/stream/route.ts` — the SSE endpoint. Replays the current
  session **and the current leaderboard** to each newly-connected client, then
  streams live `state` / `reminder` / `leaderboard` events (with a heartbeat).
  `src/app/api/game/publish/route.ts` — the host POSTs state / reminders here and
  attendees POST `score`; both are `runtime = "nodejs"`, `dynamic` (the 6 page
  routes stay static).
- `src/utils/realtime.ts` — `GameChannel`, a **transport facade**: picks
  `SseTransport` (default, cross-device — EventSource in, `fetch` POST out) or
  `BroadcastTransport` (same-browser, offline local-dev) via
  `REALTIME_TRANSPORT` (`NEXT_PUBLIC_REALTIME_TRANSPORT`, default `sse`). Callers
  don't care which is active. A real socket backend can still drop in here.
- `src/utils/use-game-channel.ts` — `useGameChannel({ onState, onReminder,
  getStateForSync })`. All inbound handling runs from message events (never
  synchronously in an effect body), so handlers can `setState` freely.
- The **host** broadcasts a `GameSessionState` snapshot on every change and
  re-shares it when a late-joining attendee sends `RequestState` (handshake — so
  tab open order doesn't matter). Reminders go out as one-off events.
- The **attendee game** reacts to host commands by status *transition* (a
  re-broadcast snapshot never double-fires): host unleashes the boss → drops into
  the boss fight with the host's shape; host resumes → the boss slips away; host
  ends/locks → the round wraps. A "Live · hosted from the control room" badge
  shows when a host is connected, and the local auto-boss is suppressed (the host
  drives it). With **no host connected**, the round still auto-runs standalone.
- Reminders are received globally by `AttendeeRealtimeListener` (mounted in the
  attendee shell), so a host nudge toasts + speaks on whatever screen the
  attendee is on.

**Shared live leaderboard (server-aggregated).** Scores actually flow across
devices into one board the host shows on the big screen:

- Each attendee device has a stable identity via `usePlayerIdentity()`
  (`src/utils/player-identity.ts`): a persisted random id + a friendly
  auto-generated handle (e.g. "Swift Otter") so the board shows distinct players.
  Pools/keys live in `src/constants/player.ts`.
- The attendee game flushes its score (throttled, `GAME_CONFIG.scoreSyncIntervalMs`)
  as a `Score` message; `src/server/game-hub.ts` keeps the latest score per
  `playerId`, recomputes the top-`leaderboardSize` board, and fans a `Leaderboard`
  event out to everyone. The **server is the single source of truth** — it
  ignores scores while the host has the board **locked**, and clears it when the
  host opens a fresh round (Lobby/reset).
- The **host** renders that live board via `toLeaderboard()` and announces the
  winner from the real top scorer (`getWinner()`); the **attendee** HUD/summary
  rank reads from the same board (`getRankAmong` / `getPlayersBeatenAmong`),
  falling back to the mock competitors only for a solo run.
- Aggregation is server-side, so it works over SSE (the default — Render **and**
  local two-window dev). The same-browser `broadcast` fallback has no server to
  aggregate, so the shared board is an SSE-mode feature.

**Navi voice (Web Speech API).** Opt-in, **off by default** (the text bubble
still leads). A speaker toggle (`NaviVoiceToggle`) sits in the attendee header
and persists the preference to localStorage:

- `src/utils/navi-voice.ts` — `speakLine` (de-dupes the current line, never
  queues) + a tiny `useSyncExternalStore`-backed store so the header toggle and
  the speaking screens share one source of truth across route changes.
  `src/constants/voice.ts` holds `VOICE_CONFIG` / `VOICE_PREF`.
- Navi reads her scripted line on the home hero (re-reads it the moment voice is
  enabled) and calls out the boss warning / defeat / escape / game-over and host
  reminders during the game.

Verified against a production server (`next start`) in headless Chrome with two
**isolated browser contexts** (which can't share BroadcastChannel — so the sync
is provably the SSE server): the host's "Start round" → "Spawn boss (Circle)" lit
up the boss + draw prompt + toast on the attendee, "End game" rolled it to the
summary, tapping a virus scored +10, no console errors, no overflow at 430px.
The **shared leaderboard** was verified the same way: an attendee ("Lucky Panda")
tapped to a score in one isolated context and that exact handle + score rendered
on the host's live board in the other, then "Announce winner" crowned the real
scorer. Server transport unit-tested too (live relay, replay-on-connect, reminder
fan-out, and leaderboard: aggregation, live re-rank, replay-on-connect,
lock-freeze, reset-clear, 400 on bad payload). **To demo cross-device, deploy
to Render and open `/host` on the presenter's device and `/game/play` on each
attendee's phone** (any network). Locally, two browser windows work the same.

## Status — demo complete 🎉

All **5 demo screens are built** (see the scope table above), plus **cross-device
realtime** host→attendee sync (SSE, Render-ready), a **shared live leaderboard**
(server-aggregated), and Navi voice (above). `ScreenStub`
(`src/components/scaffold`) is unused — keep it for any future scaffolding.
Remaining ideas (not yet requested): multi-instance scaling (swap the in-memory
hub for Redis pub/sub behind the same `GameChannel` seam), persisting the board
across server restarts, and the remaining (post-demo) modules beyond these 5.
