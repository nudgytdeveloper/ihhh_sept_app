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
- Voice: **Navi speaks** her scripted lines — opt-in speaker toggle, **off by
  default** (the text bubble still leads). Default engine is the free **Web
  Speech API** (robotic); set `NEXT_PUBLIC_VOICE_PROVIDER=elevenlabs` +
  server-only `ELEVENLABS_API_KEY` to upgrade to a natural **ElevenLabs** voice
  (proxied by `/api/voice`), with automatic Web-Speech fallback. See
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
│  ├─ (attendee)/             # attendee shell (ambient bg, header, AttendeeShell: onboarding gate + live phase/reminders/leaderboard/headcount)
│  │  ├─ layout.tsx
│  │  ├─ page.tsx             # Screen 1 (/) — thin; renders navigator-home (live phase + onboarded persona)
│  │  ├─ schedule/page.tsx    # Screen 2  (/schedule) — thin; renders schedule-screen
│  │  └─ game/
│  │     ├─ lobby/page.tsx    # Screen 3  (/game/lobby)
│  │     └─ play/page.tsx     # Screen 4  (/game/play)
│  ├─ host/
│  │  ├─ layout.tsx           # host control-room shell
│  │  └─ page.tsx             # Screen 5  (/host)
│  └─ api/
│     ├─ game/                # realtime SSE endpoints (server route handlers)
│     │  ├─ stream/route.ts   # SSE stream — host + attendees subscribe (phase + state + leaderboard + presence); attendees pass ?playerId for the headcount
│     │  └─ publish/route.ts  # host POSTs phase/state/reminders; attendees POST scores (fan-out)
│     └─ voice/route.ts       # Navi cloud TTS: POST a line → ElevenLabs (server-only key) → MP3; cached, 501 when unconfigured
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
│  ├─ realtime.ts             # REALTIME_CHANNEL, RealtimeMessage (State/Reminder/Score/Leaderboard/Phase/Presence/Countdown), paths
│  ├─ voice.ts                # VOICE_CONFIG, VOICE_PREF, VOICE_STORAGE_KEY + VoiceProvider, VOICE_PROVIDER, VOICE_API_PATH, ELEVENLABS_CONFIG (Navi voice)
│  ├─ player.ts               # attendee identity: storage keys, handle pools, seat-allocation pools
│  └─ index.ts                # barrel
├─ utils/                     # ⚠️ all reusable functions live here (see rules)
│  ├─ format.ts               # formatCountdown, formatScore, getInitials, template
│  ├─ event.ts                # phase helpers (getPhaseState…) + getAvatarScript
│  ├─ game.ts                 # game/leaderboard/host helpers (getGameStatusMeta, getLiveRank, toLeaderboard, getRankAmong, getHostControls…)
│  ├─ shape-detection.ts      # boss draw-to-defeat matcher (matchShape / classifyStroke)
│  ├─ realtime.ts             # GameChannel — SSE / BroadcastChannel transport facade (swappable)
│  ├─ use-game-channel.ts     # useGameChannel hook (publish state/score/reminder/phase + subscribe state/leaderboard/phase/presence; passes playerId)
│  ├─ navi-voice.ts           # speakLine (ElevenLabs /api/voice → MP3, else Web Speech; auto-fallback) + useNaviVoice store
│  ├─ player-identity.ts      # per-device identity (usePlayerIdentity, completeOnboarding, attendeeFromIdentity)
│  └─ index.ts                # barrel
├─ lib/
│  └─ utils.ts                # shadcn `cn()` helper ONLY (ecosystem convention)
├─ server/                    # ⚠️ server-only (never imported by client / barrel)
│  └─ game-hub.ts             # in-memory SSE pub/sub hub: host state + event phase + subscribers + aggregated leaderboard + live presence headcount (refcounted per device)
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

- `avatar-host.tsx` — Navi, the animated SVG mascot (mood-driven via the Script Engine); also accepts an optional transient `reaction` (bounce/wiggle/wink/glance) + a `talking` mouth, driven by `navi-host`. Calm by default, so the other screens that use her are unchanged
- `navi-host.tsx` — **`"use client"`** the *interactive* host (home hero only): owns the tappable avatar, attribution, and speech bubble. Tap → bounce + sparkle burst + a `NAVI_REACTIONS` one-liner that swaps into the bubble (spoken if voice is on); idle winks/glances; reacts live to the host advancing the phase (`NAVI_ARRIVAL_LINES`) and the headcount rising (`NAVI_PRESENCE_LINE`)
- `navi-tips.tsx` — **`"use client"`** rotating, phase-aware tips ticker (`NAVI_TIPS`) — proactive guidance, tap for another; host-led, never a chat box
- `navigator-hero.tsx` — composes `NaviHost` + the single next-action CTA + `NaviTips`
- `phase-progress.tsx` — event-journey track with Now / Up next callouts
- `game-preview-card.tsx` — live game **entry point** + leaderboard peek (not the game itself)
- `status-card.tsx` — check-in + seat
- `reminders-card.tsx` — proactive reminders
- `reveal.tsx` — staggered entrance wrapper

Supporting art: `src/components/game/mini-virus.tsx`. `page.tsx` is now a thin
server component rendering `navigator-home.tsx` (`"use client"`), which reads the
**live host-driven phase** from `useEventPhase()` (see Attendee onboarding +
live journey, below) and the **onboarded persona** (name + seat) from
`usePlayerIdentity()` via `attendeeFromIdentity()`. The journey defaults to phase
1 (Registered). The game-preview leaderboard *peek* reads the shared live board
(`useLiveLeaderboard()` → `toLeaderboard()`), showing a no-"You" sample teaser
only before any scores arrive. The game-preview **"online" stat** is the live
connected-attendee headcount (`usePlayerCount()`, min 1 since this device counts)
— not a seed.

**Interactive Navi (the "lively host" layer).** On the home hero Navi is no
longer a static mascot: `navi-host.tsx` makes her **tappable** (springy bounce +
sparkle burst + happy-mood flash + a playful one-liner that swaps into her
bubble) and **alive** (idle winks/glances, a speaking mouth), and she reacts
**live** to the event — an excited wiggle + a contextual line when the host
advances the phase or the attendee headcount jumps. A `navi-tips.tsx` ticker
rotates phase-aware guidance under the CTA. The tap/idle/reaction mechanics are
centralized in `useNaviGestures()` (`src/utils/use-navi-gestures.ts`) + a
reusable `TappableNavi` button (`src/components/navigator/tappable-navi.tsx`), so
the **schedule guide and lobby coach Navis are tappable too** — their one-liner
swaps into that screen's own intro/bubble. Copy + timings + the `NaviReaction`
enum live in `src/constants/navi.ts`; selection/formatting helpers in
`src/utils/navi.ts`; the `navi-*` gesture keyframes in `globals.css` are all
reduced-motion-guarded. This stays true to the product direction — **Navi
offers, the attendee never has to ask** (no chat box). Verified end-to-end in
headless Chrome (tap reaction, tip rotation, live phase + presence reactions,
the "tap me" hint) with no console errors and no overflow at 430px.

## Screen 2 — built

**Event Schedule / Phase Timeline** is implemented at
`src/app/(attendee)/schedule/page.tsx`, composed from `src/components/schedule/`:

- `schedule-overview.tsx` — compact **tappable** Navi guide (tap → reaction +
  one-liner swap, via `useNaviGestures`/`TappableNavi`) + day-at-a-glance progress
  ("Phase n of N", current phase, progress bar)
- `schedule-timeline.tsx` — vertical phase timeline; each row's state comes from
  `getPhaseState()` (`PhaseProgressState`: Done / Current / Next / Upcoming),
  with labels from `PHASE_STATE_META`. The current phase is emphasized and
  carries the single CTA, pulled from the Script Engine so the timeline and the
  host stay in sync.

`page.tsx` is a thin server component rendering `schedule-screen.tsx`
(`"use client"`), which reads the **live host-driven phase** (`useEventPhase()`)
and the onboarded name (`usePlayerIdentity()`). Reads `MOCK_SCHEDULE` (times) +
`PHASE_META`; reuses `AvatarHost` and `Reveal`. Verified mobile (430px) + desktop
with no overflow.

## Screen 3 — built

**Game Lobby** is implemented at `src/app/(attendee)/game/lobby/page.tsx` (a thin
server component that exports `metadata` and renders the client orchestrator
`lobby-screen.tsx`), composed from `src/components/game/`:

- `lobby-hero.tsx` — game banner: status pill, floating mini-viruses, and a
  "who's in" **live headcount** ("online now") with stacked avatars capped to it
- `lobby-coach.tsx` — compact **tappable** Navi coaching the attendee before the
  round (tap → reaction + one-liner swap, via `useNaviGestures`/`TappableNavi`)
- `how-to-play.tsx` — 3 rules (tap viruses → beat the COVID Boss by drawing a
  shape → climb the leaderboard); numbers from `GAME_CONFIG`, shapes from
  `SHAPE_META`
- a sticky glass action bar with the single status-aware CTA

`lobby-screen.tsx` (`"use client"`) reads the live connected-attendee count via
`usePlayerCount()` (min 1). Game state is driven by `GameStatus` via
`GAME_STATUS_META` + the `src/utils/game.ts` helpers (`getGameStatusMeta`,
`isGameJoinable`, `getLobbyCtaLabel`). Reuses `AvatarHost`, `MiniVirus`, and
`Reveal`. Verified mobile (430px) + desktop with no overflow.

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
  Lock toggle, and Announce winner (crowns `getWinner()` with a 🏆 badge); the
  announce fires a celebratory **confetti burst** (`ConfettiBurst` from
  `src/components/effects/confetti.tsx`, tuned by `CELEBRATION` in `constants/host.ts`)
  — and, because the announce broadcasts `winnerName` in the session state, the
  celebration goes **room-wide** to every attendee phone too (see below)
- `host-activity-log.tsx` — timestamped feed of recent actions (newest first,
  capped), tone-colored via `LOG_TONE_DOT`

Reads `MOCK_EVENT_STATE` + `MOCK_LEADERBOARD`. Uses the wider control-room shell
at `src/app/host/layout.tsx` (`max-w-5xl`, no ambient gradient). Verified
end-to-end in headless Chrome (full Lobby → Active → Boss → Ended → Locked flow,
winner announce, reminder toasts) at mobile (430px) + desktop with no overflow.

## Realtime sync + Navi voice — wired

Several post-demo extensions are now in place: realtime host→attendee control, a
shared live leaderboard, Navi voice, **attendee onboarding**, and a
**host-driven live event journey** (the last two are detailed first, below).

**Attendee onboarding (self-service identity).** New visitors are gated behind a
Navi-led welcome (`src/components/navigator/welcome-gate.tsx`) that asks their
name and shows an **auto-allocated seat**; the entered name + seat then drive the
navigator persona (home/schedule/lobby/status) **and** the shared-leaderboard
handle — replacing `MOCK_ATTENDEE`. Identity lives in
`src/utils/player-identity.ts` (`usePlayerIdentity`, `completeOnboarding`,
`attendeeFromIdentity`; seat pools in `src/constants/player.ts`), persisted
per-device via `useSyncExternalStore` (SSR-safe). `identity.onboarded` gates the
app; `identity.id === ""` means "not loaded yet".

**Host-driven live event journey.** The current `EventPhase` is now shared live
state over SSE (same hub as the game), defaulting to **phase 1 (Registered)**.
The Host Control Panel has an **Event Journey** control
(`src/components/host/event-journey-control.tsx` — advance to next / jump to any
phase) that broadcasts the phase; every attendee's Navi message, journey track,
and schedule update live. Plumbing: `RealtimeMessage.Phase`, hub
`publishPhase`/`getCurrentPhase` (replayed on connect), `GameChannel.publishPhase`
/ `useGameChannel({ onPhase })`. The attendee area subscribes **once** in
`src/components/navigator/attendee-shell.tsx` (`AttendeeShell` — owns the phase +
reminder + leaderboard subscription, provides phase via `useEventPhase()` and the
shared board via `useLiveLeaderboard()`, and renders the onboarding gate); it
replaced the old `AttendeeRealtimeListener`.

**Room-wide winner celebration.** The host's session snapshot already carries
`winnerName`, so `AttendeeShell` watches it: when a *new* winner is announced,
every onboarded attendee phone celebrates on whatever screen it's on — a
`ConfettiBurst` + a 🏆 toast + Navi voicing the cheer (`NAVI_WINNER_CHEER` /
`formatNaviWinner`). The announced name is also shared via `useWinnerName()`, so
the home Navi (`NaviHost`) cheers *visually* (a wiggle + the cheer line in her
bubble; the voice stays with `AttendeeShell` so she doesn't talk over herself).

**Synchronized pre-round countdown (Navi leads across all phones).** The Host
Control Panel's **"3·2·1 Start"** button (`host-status-banner`) fires a one-off
`RealtimeMessage.Countdown` (hub `publishCountdown` → fanned to every SSE client,
**not** stored, so a late joiner won't replay a finished count). Each device —
attendee phones via `AttendeeShell`, and the host's own screen — runs the same
local `useCountdown` ticker on receipt, so the "3 · 2 · 1 · GO!" lines up without
any clock-sync. `CountdownOverlay` (`src/components/effects/countdown-overlay.tsx`)
is the full-screen Navi-led overlay; she narrates each tick aloud when voice is
on. The host schedules the actual round start (`handleStart`) for the end of the
count, so the round goes live exactly as it hits **GO!**. Plumbing mirrors the
reminder path: `GameChannel.publishCountdown` / `useGameChannel({ onCountdown })`,
`countdownGoMs` + reused `introSeconds` in `GAME_CONFIG`, copy in `constants/navi.ts`.

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
  **phase**, session, **leaderboard, and presence count** to each newly-connected
  client, then streams live `phase` / `state` / `reminder` / `leaderboard` /
  `presence` events (with a heartbeat). Attendees connect with `?playerId=` so the
  hub counts them toward the headcount (the host omits it).
  `src/app/api/game/publish/route.ts` — the host POSTs phase / state / reminders
  here and attendees POST `score`; both are `runtime = "nodejs"`, `dynamic` (the 6
  page routes stay static).
- `src/utils/realtime.ts` — `GameChannel`, a **transport facade**: picks
  `SseTransport` (default, cross-device — EventSource in, `fetch` POST out) or
  `BroadcastTransport` (same-browser, offline local-dev) via
  `REALTIME_TRANSPORT` (`NEXT_PUBLIC_REALTIME_TRANSPORT`, default `sse`). Callers
  don't care which is active. A real socket backend can still drop in here.
- `src/utils/use-game-channel.ts` — `useGameChannel({ onState, onReminder,
  onLeaderboard, onPhase, onPresence, getStateForSync, playerId })` returning `{
  publishState, pushReminder, publishScore, publishPhase }`. All inbound handling
  runs from message events (never synchronously in an effect body), so handlers
  can `setState` freely. `playerId` is forwarded into the SSE URL (attendees only,
  for the headcount); changing it (`""` → real id once identity hydrates)
  reconnects the channel once.
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

**Live attendee headcount (presence).** The "online" number on the home
game-preview, the lobby hero, and the host status banner is a real count of
connected attendee devices, not a seed:

- Each attendee SSE connection carries its device `playerId` (`?playerId=` on the
  stream); `src/server/game-hub.ts` refcounts connections per distinct id (so a
  device with several tabs — e.g. the navigator shell + the game screen — counts
  once) and fans the distinct count out as a `Presence` message on every change,
  replaying it on connect. The **host** connects without a `playerId`, so it is
  never counted.
- The single always-mounted attendee subscription in `AttendeeShell` registers
  the device and exposes the count via `usePlayerCount()`; screens show
  `Math.max(count, 1)` (this device always counts). The host reads the same count
  via `onPresence` (its "N online" stat + reminder copy).
- Like the shared board, presence is server-side, so it's an SSE-mode feature; the
  same-browser `broadcast` fallback has no server to count (stays at the local 1).

**Navi voice (Web Speech API + optional ElevenLabs).** Opt-in, **off by
default** (the text bubble still leads). A speaker toggle (`NaviVoiceToggle`)
sits in the attendee header and persists the preference to localStorage:

- `src/utils/navi-voice.ts` — `speakLine` (de-dupes the current line, never
  queues) + a tiny `useSyncExternalStore`-backed store so the header toggle and
  the speaking screens share one source of truth across route changes.
  `src/constants/voice.ts` holds `VOICE_CONFIG` / `VOICE_PREF` + the provider
  config (`VoiceProvider`, `VOICE_PROVIDER`, `VOICE_API_PATH`, `ELEVENLABS_CONFIG`).
- Navi reads her scripted line on the home hero (re-reads it the moment voice is
  enabled) and calls out the boss warning / defeat / escape / game-over and host
  reminders during the game.
- **Voice engine (default Web Speech, opt-in ElevenLabs).** By default `speakLine`
  uses the free browser **Web Speech API** — zero setup, but robotic and
  device-dependent. Set `NEXT_PUBLIC_VOICE_PROVIDER=elevenlabs` (build-time
  client switch) **and** the server-only `ELEVENLABS_API_KEY` (+ optional
  `ELEVENLABS_VOICE_ID`) to give Navi a natural **ElevenLabs** voice: the client
  POSTs each line to **`/api/voice`** (`src/app/api/voice/route.ts`,
  `runtime=nodejs`), which calls ElevenLabs with the secret key (kept server-side
  only) and returns MP3. The route caches clips in memory (Navi's lines are
  scripted + repeat), and the client caches fetched clips by text. **Graceful
  fallback:** no key (route returns 501), a failed request, or a blocked autoplay
  all fall back to the Web Speech voice, so Navi always speaks. The same-page
  toggle/de-dupe/`cancelSpeech` behavior is unchanged; `isVoiceSupported()` is
  true whenever the cloud provider is active (MP3 `<audio>` is universal).

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
lock-freeze, reset-clear, 400 on bad payload). **Onboarding + live event journey**
verified the same way (8/8 in two isolated contexts): a new attendee saw the
welcome gate, entered "Sarah Lee", got an auto seat, and landed on a home greeting
her by name with "Checked in"; the journey started at Registered; the host's
**Advance to Seated** updated her home **live** to "Your seat is ready" — plus a
6/6 server test of the phase path (live relay, replay-on-connect, re-broadcast,
400 on bad payload). **Live attendee headcount** verified the same way: 12/12
server SSE test (count up on connect, live fan-out to existing clients, host
excluded, refcount dedup for a device's 2nd tab, replay-on-connect, count down on
disconnect) + 4/4 UI in two isolated contexts (a lone attendee shows "1 online",
a second attendee live-updates both to "2", and closing it drops back to "1").
**To demo cross-device, deploy to Render and open `/host` on the presenter's
device and `/` + `/game/play` on each attendee's phone** (any network). Locally,
two browser windows work the same.

## Status — demo complete 🎉

All **5 demo screens are built** (see the scope table above), plus **cross-device
realtime** host→attendee sync (SSE, Render-ready), a **shared live leaderboard**
(server-aggregated), a **live attendee headcount** (server-tracked presence), Navi
voice, **attendee onboarding** (name + auto seat), and a **host-driven live event
journey** (above). `ScreenStub`
(`src/components/scaffold`) is unused — keep it for any future scaffolding.
Remaining ideas (not yet requested): multi-instance scaling (swap the in-memory
hub for Redis pub/sub behind the same `GameChannel` seam), persisting hub state
(phase + board) across server restarts, and the remaining (post-demo) modules
beyond these 5.
