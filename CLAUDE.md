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
npm run db:push  # apply src/server/db/schema.ts to DATABASE_URL (drizzle-kit)
npm run db:studio # browse the database (drizzle-kit studio)
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
│  ├─ manifest.ts             # PWA manifest → /manifest.webmanifest (installable; icons in public/, Phase 5)
│  ├─ error.tsx / global-error.tsx / not-found.tsx  # Navi-styled error + 404 boundaries (Phase 6)
│  ├─ (attendee)/             # attendee shell (ambient bg, header, AttendeeShell: onboarding gate + live phase/reminders/leaderboard/headcount)
│  │  ├─ layout.tsx
│  │  ├─ page.tsx             # Screen 1 (/) — thin; renders navigator-home (live phase + onboarded persona)
│  │  ├─ schedule/page.tsx    # Screen 2  (/schedule) — thin; renders schedule-screen
│  │  ├─ recaps/page.tsx      # attendee AI session recaps (/recaps, Nov Phase 4) — thin; renders recaps-screen
│  │  └─ game/
│  │     ├─ lobby/page.tsx    # Screen 3  (/game/lobby)
│  │     └─ play/page.tsx     # Screen 4  (/game/play)
│  ├─ host/
│  │  ├─ layout.tsx           # host control-room shell (+ HostNav tabs: Control panel / Roster / Sessions)
│  │  ├─ page.tsx             # Screen 5  (/host)
│  │  ├─ roster/page.tsx      # host roster / attendance list (/host/roster, Nov Phase 2)
│  │  └─ sessions/page.tsx    # host speaker sessions / transcripts (/host/sessions, Nov Phase 3)
│  └─ api/
│     ├─ game/                # realtime SSE endpoints (server route handlers)
│     │  ├─ stream/route.ts   # SSE stream — host + attendees subscribe (phase + state + leaderboard + presence); attendees pass ?playerId for the headcount + check-in stamp
│     │  └─ publish/route.ts  # host POSTs phase/state/reminders; attendees POST scores (fan-out + best-score write-through to Postgres)
│     ├─ register/route.ts    # attendee registration: upsert by corporate email → Postgres (graceful no-DB fallback)
│     ├─ roster/route.ts      # host roster: attendees ⋈ best scores + online flags ({available:false} when no DB)
│     ├─ sessions/route.ts    # speaker sessions: GET list / POST create; [id]/route.ts GET/PATCH/DELETE (Phase 3)
│     ├─ transcribe/route.ts  # STT: POST audio → ElevenLabs Scribe (reuses ELEVENLABS_API_KEY) → {text}; 501 when unset; GET {configured}
│     ├─ summaries/route.ts   # AI recaps: POST generate/cache (Gemini, per attendee goals; cache-hit needs no key) + GET list; [id] PATCH edit (Phase 4)
│     ├─ push/                # Web Push (Phase 5): route.ts GET {configured, publicKey}; subscribe/ + unsubscribe/ POST
│     ├─ host/verify/route.ts # Host passcode (Phase 6): GET {required} / POST {token} → {ok} (rate-limited)
│     ├─ health/route.ts      # Health check (Phase 6): {status, database, time} — always 200 (Render healthCheckPath)
│     └─ voice/route.ts       # Navi cloud TTS: POST a line → ElevenLabs (server-only key) → MP3; cached, 501 when unconfigured
├─ components/
│  ├─ ui/                     # shadcn/ui primitives
│  ├─ navigator/              # attendee screens (incl. notifications-card + notification-toggle — Web Push opt-in, Phase 5)
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
│  ├─ registration.ts         # RegistrationStep, LEARNING_GOAL_PRESETS, REGISTRATION_LIMITS, REGISTER_API_PATH
│  ├─ roster.ts               # ROSTER_API_PATH, ROSTER_REFRESH_MS, CSV filename/headers (host roster)
│  ├─ sessions.ts             # SessionStatus, SESSION_STATUS_META, RECORDING_CONFIG, SCRIBE_CONFIG, SttProvider/STT_PROVIDER, RecorderState, API paths
│  ├─ summaries.ts            # SUMMARY_CONFIG (Gemini model/endpoint), SUMMARY_LIMITS, WHATSAPP_SHARE, API paths (Phase 4)
│  ├─ push.ts                 # PushStatus, VAPID_ENV, PUSH_* API paths, SW path/scope, notification copy/tags (Phase 5)
│  ├─ host-auth.ts            # HostAuthStatus, HOST_TOKEN_HEADER, HOST_ONLY_MESSAGE_TYPES, verify path (Phase 6)
│  ├─ rate-limit.ts           # RateLimitBucket + RATE_LIMITS per costly/abusable route (Phase 6)
│  └─ index.ts                # barrel
├─ utils/                     # ⚠️ all reusable functions live here (see rules)
│  ├─ format.ts               # formatCountdown, formatScore, getInitials, template
│  ├─ event.ts                # phase helpers (getPhaseState…) + getAvatarScript
│  ├─ game.ts                 # game/leaderboard/host helpers (getGameStatusMeta, getLiveRank, toLeaderboard, getRankAmong, getHostControls…)
│  ├─ shape-detection.ts      # boss draw-to-defeat matcher (matchShape / classifyStroke)
│  ├─ realtime.ts             # GameChannel — SSE / BroadcastChannel transport facade (swappable)
│  ├─ use-game-channel.ts     # useGameChannel hook (publish state/score/reminder/phase + subscribe state/leaderboard/phase/presence; passes playerId)
│  ├─ navi-voice.ts           # speakLine (ElevenLabs /api/voice → MP3, else Web Speech; auto-fallback) + useNaviVoice store
│  ├─ player-identity.ts      # per-device identity (usePlayerIdentity, completeRegistration, attendeeFromIdentity)
│  ├─ registration.ts         # email validation/normalization + learning-goal shaping (shared by gate + /api/register)
│  ├─ csv.ts                  # generic CSV helpers (toCsvCell, buildCsv, downloadCsv)
│  ├─ roster.ts               # roster shaping (formatSeatLabel/GoalsLabel, filterRoster, summarizeRoster, rosterToCsv)
│  ├─ sessions.ts             # session sanitize/validate (title/speaker/transcript), appendSegment, countWords, pickRecordingMime, isSessionStatus
│  ├─ use-session-recorder.ts # useSessionRecorder — live STT recorder (Web Speech | Scribe MediaRecorder segments) → onSegment
│  ├─ summaries.ts            # recap helpers: isSummarizable, indexSummariesBySession, buildWhatsAppShareUrl (Phase 4)
│  ├─ push.ts                 # "use client" push store + usePushSubscription (register SW, permission→subscribe→persist) (Phase 5)
│  ├─ host-auth.ts            # "use client" host passcode store + useHostAuth + getStoredHostToken (Phase 6)
│  └─ index.ts                # barrel
├─ lib/
│  └─ utils.ts                # shadcn `cn()` helper ONLY (ecosystem convention)
├─ server/                    # ⚠️ server-only (never imported by client / barrel)
│  ├─ game-hub.ts             # in-memory SSE pub/sub hub: host state + event phase + subscribers + aggregated leaderboard + live presence headcount (refcounted per device)
│  ├─ ai/
│  │  └─ summary.ts           # generateSummary — Gemini (Google Generative Language API via fetch) recap keyed to goals; retries; throws on failure (Phase 4)
│  ├─ host-auth.ts            # isHostAuthRequired + isValidHostToken (constant-time; open when HOST_TOKEN unset) (Phase 6)
│  ├─ rate-limit.ts           # in-memory fixed-window limiter: checkRateLimit/getClientId/rateLimitResponse (Phase 6)
│  ├─ env.ts                  # startup env summary (which features on/off; warns in prod) — logged via instrumentation (Phase 6)
│  ├─ push/
│  │  └─ send.ts              # web-push sender (VAPID + aes128gcm): sendPushToAll/sendPhasePush/sendReminderPush; prunes 404/410 subs (Phase 5)
│  └─ db/                     # Postgres persistence (Drizzle) — Nov event
│     ├─ schema.ts            # attendees + game_scores + sessions + summaries + push_subscriptions (Phase 5)
│     ├─ index.ts             # lazy getDb() (null when DATABASE_URL unset; Render TLS)
│     ├─ attendees.ts         # upsertAttendee (by email; id-collision retry) + markCheckedIn (memoized) + getAttendeeById + listRoster (⋈ scores)
│     ├─ scores.ts            # upsertBestScore (GREATEST keeps the event-best)
│     ├─ sessions.ts          # create/list/get/update/delete sessions + toSession DTO mapper
│     ├─ summaries.ts         # getSummary (by session×attendee) / listByAttendee / upsert (regenerate) / updateContent (edit) + toSummary
│     └─ push-subscriptions.ts # upsert/list/list-by-attendee/delete push subscriptions (keyed by endpoint, Phase 5)
├─ types/
│  ├─ index.ts                # shared TS types (Attendee, ScheduleItem, GameSession, GameSessionState, ScoreEntry, RosterEntry, Session, Summary, …)
│  └─ speech-recognition.d.ts # ambient Web Speech API types (SpeechRecognition — not in TS DOM lib yet)
├─ data/
│  └─ event.ts                # mock demo data (attendee, schedule, leaderboard, state)
└─ instrumentation.ts         # Next register() hook — logs the startup env summary (Phase 6)
```

Repo root also holds `next.config.ts` (security headers / CSP, Phase 6) and
`render.yaml` (infra-as-code deploy Blueprint, Phase 6).

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

**Attendee onboarding → registration (Nov event, Phase 1).** New visitors are
gated behind a Navi-led welcome (`src/components/navigator/welcome-gate.tsx`) in
**two steps**: name + **corporate email** (capture-only, never verified), then
**learning goals** (preset chips capped at `REGISTRATION_LIMITS.maxGoals` + a
free-text goal — these later drive the personalized AI session summaries). It
also shows the **auto-allocated seat**. Submitting calls
`completeRegistration()` (`src/utils/player-identity.ts`), which POSTs to
**`/api/register`** — the server **upserts by email** (the canonical identity)
into Postgres and the client adopts the returned record, so a returning attendee
re-registering on a new device recovers their original id + seat (and with them
their leaderboard/presence identity). On a failed request the gate shows an
inline error + retry; with no `DATABASE_URL` the server accepts the registration
unpersisted (local-dev fallback). Name + seat still drive the navigator persona
(home/schedule/lobby/status) **and** the shared-leaderboard handle. Identity
(now incl. `email` + `goals`) persists per-device via `useSyncExternalStore`
(SSR-safe); `identity.onboarded` gates the app; `identity.id === ""` means "not
loaded yet". Copy/limits in `src/constants/registration.ts`; validation/shaping
helpers in `src/utils/registration.ts` (shared by gate + API route).

**Database (Postgres + Drizzle, server-only).** `src/server/db/` holds the
schema (`attendees`: email-unique, seat + goals jsonb, `checked_in_at` for the
Phase-2 attendance stamp), a lazy `getDb()` client (null when `DATABASE_URL` is
unset → callers degrade gracefully; TLS auto-enabled for `*.render.com` hosts),
and the attendee store (`upsertAttendee` — keeps the device id as row id when
free, retries with a server id on collision). Like `game-hub.ts`, **never
import it from client code / the barrels.** Schema changes apply with
`npm run db:push` (drizzle-kit; loads `.env.local`). Local dev:
`createdb ihhh_dev` + `DATABASE_URL=postgres://localhost:5432/ihhh_dev`;
production: a Render Postgres instance (Internal URL on the web service).

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

## Nov 2026 event — in progress

Client approved the June MVP; the ticket re-opened for the **Nov 2026 event**
with 4 required features (Notion task 444): **1) Registration** (corporate
email + learning goals), **2) Virus Game roster** (all registered attendees with
scores; doubles as attendance), **3) Speaker transcripts** (STT per speaker + AI
per-guest summaries keyed to learning goals, editable + WhatsApp share), **4)
Phone notifications** (in-app + PWA push). Decisions: email is capture-only,
one host device records speakers, `wa.me` share links (no WhatsApp API).

Build order: **Phase 1 — registration + Postgres (✅ done, see above)** ·
**Phase 2 — roster/attendance + persistent scores (✅ done, below)** ·
**Phase 3 — speaker sessions + STT (✅ done, below)** ·
**Phase 4 — AI summaries (Gemini) + WhatsApp share (✅ done, below)** ·
**Phase 5 — PWA + Web Push notifications (✅ done, below)** ·
**Phase 6 — hardening/deploy (✅ done, below)**. **All 6 phases complete.**

**Phase 6 — hardening (built).** The demo→event hardening pass, in five parts:

- **Host control-room passcode.** A server-only `HOST_TOKEN` locks the host down.
  Only a device that entered the passcode may drive the event — phase, reminders,
  game state, countdown — and, crucially, fan a **push notification to every
  phone**. `/api/game/publish` now 401s those host-only message types
  (`HOST_ONLY_MESSAGE_TYPES`) unless a valid `x-host-token` header is present;
  attendee **score** posts are exempt, so attendees never need the passcode.
  `src/server/host-auth.ts` (constant-time compare; **open when `HOST_TOKEN` is
  unset** — local dev / trusted demo), `/api/host/verify` (GET `{required}` / POST
  `{ok}`), client store `src/utils/host-auth.ts` (`useHostAuth`, `HostAuthStatus`)
  → the passcode gate `src/components/host/host-gate.tsx` wraps `/host/*` in the
  host layout. The SSE transport (`src/utils/realtime.ts`) attaches the stored
  passcode to publish requests automatically (attendees have none). Copy/constants
  in `src/constants/host-auth.ts`.
- **Rate limiting.** In-memory per-IP fixed-window limits (`src/server/rate-limit.ts`,
  buckets/limits in `src/constants/rate-limit.ts`) on the **costly/abusable**
  routes only — summaries (Gemini $), transcribe (ElevenLabs $), register,
  push-subscribe, and host-verify (brute-force guard) — returning **429 +
  Retry-After**. The cheap realtime **score/publish path is deliberately NOT
  limited**: at a venue every attendee shares one NAT/public IP, so an IP limit
  there would throttle real players (host actions are protected by the passcode
  instead). Single-instance (matches the hub); swap for Redis if scaled out.
- **Security headers** (`next.config.ts`, every route): a CSP tuned to what the app
  loads (`'self'` + `'unsafe-inline'` for Next's hydration/Tailwind — nonces would
  force every page dynamic; `connect-src 'self'` for SSE; `worker-src 'self'` for
  the SW; `frame-ancestors 'none'`; data:/blob: for icons + voice clips), plus
  HSTS (prod only), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy`, and a `Permissions-Policy` that allows only `microphone=(self)`
  (host STT) + `autoplay=(self)` (Navi voice).
- **Error boundaries + health + env validation.** Navi-styled `src/app/error.tsx`
  (retry) / `global-error.tsx` (inline-styled last resort) / `not-found.tsx`, a
  `/api/health` endpoint (reports DB reachability but **always 200** so a DB blip
  doesn't drop the service from rotation), and `src/instrumentation.ts` →
  `src/server/env.ts` logging a startup summary of which features are on/off
  (warns when `HOST_TOKEN`/`DATABASE_URL` are unset in production).
- **`render.yaml`** — infra-as-code for the web service (build/start commands,
  `healthCheckPath: /api/health`, declared env vars; secrets stay `sync: false`).

Verified against a production build (`next start`, `HOST_TOKEN` set) + real local
Postgres: **24/24** — all security headers present (CSP incl. `frame-ancestors
'none'`, no `unsafe-eval` in prod), health 200 + DB ok, host verify
(required/wrong/correct), publish **401 without passcode / 200 with / score open**,
rate-limit **429 + Retry-After** after the bucket, and the 404 boundary. In-browser
the app **renders + hydrates under the production CSP with zero violations / no
console errors**, and the passcode gate shows on `/host` with the control panel
content hidden behind it. Startup env summary logged as expected.
**Deploy note:** set `HOST_TOKEN` on Render (the host enters that passcode once);
without it the control room stays open. No DB migration this phase.

**Phase 5 — PWA install + Web Push notifications (built).** This is the "phone
notifications for next event timelines" requirement: attendees opt in, and the
host's **reminders** and **event-journey phase changes** then arrive as a real
phone notification **even when the app is backgrounded/closed** — no third-party
push service, it runs on the same single Render web service as the SSE hub.

- **Transport.** Browser **Push API** + a **VAPID** keypair (server-only private
  key). Delivery is `web-push` (`src/server/push/send.ts`) — the one place we use
  a library instead of a hand-rolled `fetch`, because Web Push is a crypto
  protocol (aes128gcm payload encryption + a VAPID ES256 JWT). `sendPushToAll` /
  `sendPhasePush` / `sendReminderPush` fan a payload out to every stored
  subscription and **prune** a subscription when its push service replies 404/410.
- **Persistence.** `push_subscriptions` (Postgres): keyed by push `endpoint`,
  stores `p256dh` + `auth` + `attendeeId`. Store in
  `src/server/db/push-subscriptions.ts` (upsert on endpoint). Requires
  `DATABASE_URL` (nothing to deliver to without a stored subscription).
- **Routes.** `GET /api/push` → `{configured, publicKey}` (client reads the VAPID
  public key here — the private key never leaves the server); `POST
  /api/push/subscribe` stores the subscription + fires a confirmation push; `POST
  /api/push/unsubscribe` drops it. The host's existing `/api/game/publish`
  additionally calls `sendReminderPush` / `sendPhasePush` **fire-and-forget** (the
  SSE fan-out never waits on push), so the same host action drives both the live
  in-app toast (SSE) and the phone notification (push).
- **Service worker.** `public/sw.js` — deliberately minimal: `push` (show
  notification) + `notificationclick` (focus/open, deep-links a phase push to
  `/schedule`). **No `fetch` handler**, so it never intercepts Next navigation or
  caches — installing it can't break the app.
- **PWA install.** `src/app/manifest.ts` → `/manifest.webmanifest` (standalone,
  theme color, 4 icons incl. maskable); branded Navi icons + monochrome badge in
  `public/` (`icon-192/512{,-maskable}.png`, `apple-touch-icon.png`,
  `badge-72.png`); root layout adds `appleWebApp` + apple-touch icon. Installing
  to the home screen is also the prerequisite for Web Push on **iOS 16.4+**.
- **Client + UI.** `src/utils/push.ts` — a module-level store (like `navi-voice`)
  behind `usePushSubscription()`; registers the SW (in `AttendeeShell` on mount),
  runs the permission → subscribe → persist flow, and exposes a `PushStatus`
  (`Unknown`/`Unsupported`/`Unconfigured`/`Blocked`/`Off`/`On`). The attendee
  opts in via the home **`NotificationsCard`** (Navi-styled) or the header bell
  **`NotificationToggle`** (both share the one store). Both hide themselves when
  push is unsupported on the device or not switched on server-side, so nothing is
  advertised that can't deliver. Copy/config in `src/constants/push.ts`.
- **Env.** Server-only `VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` + `VAPID_SUBJECT`
  (generate with `npx web-push generate-vapid-keys`; set the **same three** on
  Render **and** local `.env.local` — unlike the ElevenLabs/Gemini keys, push is
  fully testable locally over Chrome). No keys ⇒ `/api/push` reports
  `{configured:false}`, the opt-in UI stays hidden, and nothing else changes.
  **Deploy note:** run `db:push` to add `push_subscriptions` to Render (same
  external-URL + `?sslmode=require` flow as prior tables), and set the three VAPID
  env vars, before the feature works in production.

Verified against a production build (`next start`) + real local Postgres: **33/33
checks** — the `web-push` crypto pipeline (valid VAPID token + aes128gcm), the
routes end-to-end with a **real encrypted push delivered over TLS to a local mock
push service** (welcome push on subscribe + "what's next" push on a phase
publish, both aes128gcm with a VAPID Authorization), subscribe/unsubscribe DB
round-trips, 400 on a bad body, and the manifest + all icons + `sw.js` serving
(SW has push + notificationclick, no fetch handler). In-browser (Chrome, seeded
onboarded identity): the SW registered + controlled, the `NotificationsCard` +
header bell rendered with no permission prompt, **no 430px overflow**
(`scrollWidth === innerWidth` measured in a 430px iframe), and no console errors.

**Phase 4 — personalized AI session recaps + WhatsApp share (built).**

- **Summaries.** `summaries` (Postgres): one per (session × attendee) — unique
  constraint, FK to `sessions` with `ON DELETE CASCADE`; `content` + `edited`.
  Store in `src/server/db/summaries.ts`. The recap is personalized to the
  attendee's learning goals (server prefers the stored `attendees.goals`, falls
  back to goals sent by the client).
- **Generation (Gemini).** `src/server/ai/summary.ts` calls the **Google
  Generative Language API via `fetch`** (no SDK dependency — same proxy pattern
  as voice/transcribe; auth via the `x-goog-api-key` header, model in the URL
  path, `thinkingBudget: 0`). Model default `gemini-2.5-flash` (override
  `GEMINI_MODEL`; bump to `gemini-2.5-pro` for max quality). The prompt asks for
  a short plain-text recap + "Key points" + "Your action items" tied to the
  goals, grounded in the transcript. `GEMINI_API_KEY` is server-only.
  (Provider was switched from Claude to Gemini — the client had no Anthropic key.)
- **Routes.** `POST /api/summaries` returns the **cached** summary if one exists
  (no key needed) — otherwise generates, stores, returns (needs the key; 501
  when unset; `regenerate: true` forces a fresh one). `GET /api/summaries?attendeeId=`
  lists an attendee's recaps; `PATCH /api/summaries/[id]` saves an edit (sets
  `edited`).
- **Attendee UI.** `/recaps` (`src/components/navigator/recaps-screen.tsx` +
  `summary-card.tsx`, reached from a home entry card `recaps-entry-card.tsx`):
  a gradient header with the attendee's goal chips, then one card per recorded
  talk — **Generate my recap** → read → **Edit**/save → **Share on WhatsApp**
  (`wa.me/?text=` click-to-chat, `buildWhatsAppShareUrl`; no WhatsApp API,
  per the Nov decision). Regenerate re-runs Claude.

**IMPORTANT — `GEMINI_API_KEY` is prod-only** (like `ELEVENLABS_API_KEY`):
set it in Render's env, not local `.env.local`. So `/api/summaries` **generation**
returns 501 locally and the recaps screen shows a friendly "not switched on yet"
notice; the real Gemini generation path is verified in production. **Cache hits,
editing, listing, and WhatsApp share all work with no key** (no generation
needed), so those are fully verified locally.

Verified against a production build + real local Postgres: sessions/summaries
CRUD + validations (POST 400 missing ids; generate → 501 with no key; cache-hit
POST → 200 with no key; GET list; PATCH edit → `edited=true`; 404 on unknown id);
attendee E2E in-browser (seeded onboarded identity) — the recaps screen rendered
the goal chips + per-session cards, the graceful 501 toast fired on Generate, an
edit saved and DB-persisted, the WhatsApp `wa.me` URL built correctly
(title — speaker + recap), 430px no-overflow, no console errors.

**Phase 3 — speaker sessions + live STT (built).**

- **Sessions.** `sessions` (Postgres): title, speaker, `status`
  (`SessionStatus`: Scheduled → Recording → Ready), transcript.
  `GET/POST /api/sessions` + `GET/PATCH/DELETE /api/sessions/[id]` (persistence
  required — 503 when no DB, unlike registration's graceful fallback). Store in
  `src/server/db/sessions.ts` (+ the `toSession` DTO mapper).
- **Two STT engines behind one recorder** (mirrors the voice provider). The host
  recorder (`src/components/host/session-recorder.tsx`, driven by
  `useSessionRecorder` in `src/utils/use-session-recorder.ts`) picks its engine
  from `STT_PROVIDER` (`NEXT_PUBLIC_STT_PROVIDER`, default `webspeech`):
  - **Web Speech (default, free, zero-config):** the browser's
    `SpeechRecognition` streams final results directly (no upload, no key) —
    works locally + for a no-key demo (Chrome/Safari).
  - **Scribe (opt-in cloud):** `MediaRecorder` captures short,
    independently-decodable segments (stop/restart each `RECORDING_CONFIG.segmentMs`)
    POSTed to `/api/transcribe` → ElevenLabs Scribe (reuses the **same**
    server-only `ELEVENLABS_API_KEY` as voice; 501 when unset → the recorder
    shows a "not configured" notice; `GET /api/transcribe` reports `{configured}`).

  Each finalized chunk appends live (`appendSegment`) and the transcript is
  persisted to the session (throttled during recording + a final flush on stop,
  which also sets status Ready). Once stopped, the transcript is editable
  (fix STT slips before summaries) and saved via PATCH.
- **Host UI.** `/host/sessions` (`sessions-screen.tsx`): create a session per
  speaker, master list ⇄ single-session recorder, reached via the third HostNav
  tab. The transcript feeds the Phase-4 per-attendee AI summaries.

**IMPORTANT — `ELEVENLABS_API_KEY` is prod-only:** it lives in Render's env, not
local `.env.local`, so `/api/transcribe` returns 501 locally and the default
Web Speech engine is what runs in local dev. The real Scribe audio path is
verified in production (where the key exists), not locally. (Voice's
`NEXT_PUBLIC_VOICE_PROVIDER=elevenlabs` is a build-time switch; the key is only
set on Render.)

Verified against a production build + real local Postgres: sessions CRUD +
validations (incl. 400 on bad status, 404 after delete); the full live loop
(create → record → segments append into a growing transcript → stop persists
`{transcript, status: ready}`) driven end-to-end in-browser with a deterministic
fake `SpeechRecognition`, confirmed persisted in the DB; manual edit → Save
persisted; 430px no-overflow on the list AND recorder views
(`scrollWidth === innerWidth`); no console errors.

**Phase 2 — roster / attendance / persistent scores (built).**

- **Persistent scores.** `game_scores` (Postgres) keeps each player's **best**
  score for the whole event: the publish route write-through persists every
  score the hub accepts (`submitScore` now returns whether it was accepted, so
  a locked board also blocks persistence) via `upsertBestScore`
  (`src/server/db/scores.ts`, `GREATEST` upsert — a lower re-report never
  downgrades). Fire-and-forget: the live board never waits on (or fails with)
  the DB. The in-memory hub board stays the live per-round view (still cleared
  on Lobby/reset); the DB row is the event-best the roster shows.
- **Attendance.** A registered attendee's first SSE connect stamps
  `checked_in_at` (`markCheckedIn` — UUID-guarded, `IS NULL`-guarded, memoized
  per process so reconnects don't re-issue the UPDATE; the memo entry is
  dropped on a failed UPDATE so it can retry).
- **Roster.** `GET /api/roster` returns every registered attendee ⋈ best score
  + `online` flag (hub `getOnlinePlayerIds()`), ordered score-desc then A–Z;
  `{available:false}` with no DB. The host screen at **`/host/roster`**
  (`src/components/host/roster-screen.tsx`, reached via the shared `HostNav`
  header tabs) shows stat cards (registered / checked-in / online-now /
  played), a searchable table (name/email filter, seat, goals, check-in badge
  with time, best score, green online dot), auto-refreshes every
  `ROSTER_REFRESH_MS`, and exports the attendance **CSV**
  (`rosterToCsv`/`downloadCsv`). Note the table needs `min-w-0` on its flex
  ancestors so `overflow-x-auto` scrolls inside the card at 430px.

Verified end-to-end against a production build + real local Postgres: check-in
stamped on first SSE connect (and only once), best-of 300/150/400 persisted as
400, locked-board score rejected (roster kept 400), online flag true while the
SSE connection was open and false after close, roster ordering + search filter
+ 430px no-overflow (measured `scrollWidth === innerWidth` in-browser; only
the table scrolls, inside its own container).

## Status — June demo complete 🎉 · Nov MVP complete · all 6 phases done ✅

All **5 demo screens are built** (see the scope table above), plus **cross-device
realtime** host→attendee sync (SSE, Render-ready), a **shared live leaderboard**
(server-aggregated), a **live attendee headcount** (server-tracked presence), Navi
voice, **attendee onboarding** (name + auto seat), and a **host-driven live event
journey** (above).

**All four Nov 2026 MVP features are built AND the full 6-phase build order is
complete**: registration, roster/attendance, speaker sessions + STT, AI recaps,
phone notifications / PWA (Phase 5), and the **hardening pass (Phase 6)** — host
passcode, rate limiting, security headers, error boundaries + health, `render.yaml`.
Phases 1–5 are **deployed + live** on Render; **Phase 6 code is built + verified
locally** (24/24) — to finish deploying it, **set `HOST_TOKEN` on the Render web
service** (the host enters that passcode) so the control room isn't open; the rest
of Phase 6 needs no config.

`ScreenStub` (`src/components/scaffold`) is unused — keep it for any future
scaffolding. Remaining ideas (not yet requested): multi-instance scaling (swap the
in-memory hub + the in-memory rate limiter for Redis behind their current seams —
the same swap would move `push_subscriptions` fan-out off the single instance),
persisting hub state (phase + board) across server restarts, and the remaining
(post-demo) modules beyond these 5.
