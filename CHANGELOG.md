# Changelog

## 2026-07-13

### Added
- Host control-room passcode (Nov Phase 6): server-only `HOST_TOKEN` gates `/host` (a Navi-styled passcode gate) and host-only publish actions — `/api/game/publish` now 401s host phase/reminder/state/countdown without a valid `x-host-token`, so attendees can't hijack the event or fan a push to every phone (scores stay open). Open when `HOST_TOKEN` is unset; `/api/host/verify` GET/POST + `src/utils/host-auth.ts` store
- Rate limiting (Nov Phase 6): in-memory per-IP fixed-window limits on the paid/abusable routes — summaries (Gemini), transcribe (ElevenLabs), register, push-subscribe, host-verify — returning 429 + Retry-After (`src/server/rate-limit.ts`, `src/constants/rate-limit.ts`); the shared-NAT score path is deliberately unthrottled
- Security headers (Nov Phase 6): CSP, HSTS (prod), X-Frame-Options DENY, X-Content-Type-Options, Referrer-Policy, Permissions-Policy on every route via `next.config.ts`
- Error boundaries + health (Nov Phase 6): Navi-styled `error.tsx` / `global-error.tsx` / `not-found.tsx`, a `/api/health` endpoint (DB reachability, always 200), and a startup env summary via `instrumentation.ts` (`src/server/env.ts`)
- `render.yaml` (Nov Phase 6): infra-as-code for the web service (build/start, `healthCheckPath: /api/health`, declared env vars)
- Web Push phone notifications (Nov Phase 5): attendees opt into alerts; host reminders and event-journey phase changes fan out a real notification (aes128gcm + VAPID via `web-push`) even with the app closed — fired fire-and-forget from `/api/game/publish`
- `push_subscriptions` table + store, `/api/push` (GET config), `/api/push/subscribe`, `/api/push/unsubscribe`; sender `src/server/push/send.ts` (prunes 404/410 subscriptions); `src/utils/push.ts` client store + `usePushSubscription` hook
- PWA install: `src/app/manifest.ts` (`/manifest.webmanifest`), branded Navi icons (192/512 + maskable + apple-touch + monochrome badge) in `public/`, iOS `appleWebApp` metadata, and a minimal push service worker `public/sw.js` (no fetch handler)
- Attendee opt-in UI: home `NotificationsCard` (Navi-styled) + header bell `NotificationToggle` (shares one push store); `src/constants/push.ts`, `PushSubscriptionInput`/`NotificationPayload`/`PushConfigResponse` types
- Personalized AI session recaps + WhatsApp share (Nov Phase 4): `summaries` table (per session × attendee, FK-cascade), `/api/summaries` (POST generate/cache — Google Gemini, keyed to the attendee's learning goals; cache-hit needs no key; 501 when unset) + GET list + `[id]` PATCH edit
- Attendee "Session recaps" screen at `/recaps` (+ home entry card): generate a recap per recorded talk, edit it, share to WhatsApp via `wa.me`; server summarizer `src/server/ai/summary.ts`
- Summaries constants/helpers (`src/constants/summaries.ts`, `src/utils/summaries.ts`: `buildWhatsAppShareUrl`, `isSummarizable`), `Summary`/`SummaryResponse`/`SummaryListResponse` types, `ROUTES.RECAPS`, `getAttendeeById`
- Speaker sessions + live speech-to-text (Nov Phase 3): `sessions` table + `/api/sessions` CRUD (`[id]` PATCH/DELETE) and `/api/transcribe` (ElevenLabs Scribe proxy, reuses `ELEVENLABS_API_KEY`, 501 when unset)
- Host Sessions screen at `/host/sessions`: create a session per speaker, record with a live-growing transcript, edit + save the transcript; third host nav tab (Sessions)
- Two STT engines behind one recorder (mirrors the voice provider): free Web Speech `SpeechRecognition` by default, ElevenLabs Scribe via `NEXT_PUBLIC_STT_PROVIDER=scribe`; `useSessionRecorder` hook handles both
- Sessions constants/helpers (`src/constants/sessions.ts`, `src/utils/sessions.ts`), CSV-free session utils, `Session`/`SessionListResponse`/`TranscribeResponse` types, `ROUTES.HOST_SESSIONS`, `formatClockTime`, ambient `SpeechRecognition` types
- Persistent game scores: `game_scores` table keeps each player's best score, written through from live score publishes (skipped while the host has the board locked) — survives server restarts and round resets
- Attendance stamping: a registered attendee's first SSE connection sets `checked_in_at` (memoized per process)
- `/api/roster` — every registered attendee with attendance mark, best score, and live online flag
- Host roster screen at `/host/roster`: stat cards (registered / checked in / online / played), searchable attendee table, auto-refresh, CSV export; host header nav tabs (Control panel / Roster)
- Roster constants (`src/constants/roster.ts`), CSV + roster helpers (`src/utils/csv.ts`, `src/utils/roster.ts`), `RosterEntry`/`RosterResponse` types, `ROUTES.HOST_ROSTER`

### Changed
- AI recap provider swapped from Claude (Anthropic) to Google Gemini (`gemini-2.5-flash`, `GEMINI_API_KEY`) — the client has no Anthropic key; recap greets the attendee by first name (no bracketed placeholders)

### Fixed
- Render deploy failure (`ERR_PNPM_OUTDATED_LOCKFILE`): synced `pnpm-lock.yaml` with the Phase 1 dependencies added via npm

## 2026-07-12

### Added
- Postgres persistence layer (Drizzle ORM): server-only `src/server/db/` (schema + lazy client + attendee store), `drizzle.config.ts`, and `db:push` / `db:studio` npm scripts; `attendees` table keyed by corporate email with seat, learning goals, and a `checked_in_at` attendance stamp
- `/api/register` — registration endpoint: validates name/email/goals, upserts by email (returning attendees recover their original id + seat on a new device), gracefully accepts unpersisted registrations when `DATABASE_URL` is unset
- Welcome gate registration (Nov-event MVP): two-step flow — name + corporate email, then learning goals (preset chips capped at 3 + free-text goal) — with inline error + retry on server failure
- Registration constants (`src/constants/registration.ts`: `RegistrationStep`, `LEARNING_GOAL_PRESETS`, `REGISTRATION_LIMITS`, `EMPTY_LEARNING_GOALS`) and helpers (`src/utils/registration.ts`: email validation/normalization, goal toggling/shaping/sanitizing)
- `LearningGoals` + `RegisteredAttendee` types; `PlayerIdentity` now carries `email` + `goals` (persisted per device)

### Changed
- `completeOnboarding(name)` replaced by async `completeRegistration({name, email, goals})` — registers server-side and adopts the returned canonical identity
- `DATABASE_URL` documented in `.env.example` (local dev + Render Postgres)

## 2026-06-17

### Fixed
- Navi voice: the first "enable voice" now stays on the natural ElevenLabs voice instead of falling back to the robotic Web Speech voice — a cold-start 502 on the first /api/voice hit is now retried (client + server) before any fallback, so the attendee no longer has to toggle voice off and on again

### Added
- CLOUD_VOICE_CONFIG (src/constants/voice.ts) — client/server retry counts + backoff for transient (5xx/429/network) cloud-voice failures

## 2026-06-15

### Added
- Host-led synchronized pre-round countdown: a new "3·2·1 Start" button on the Host Control Panel fires a "3·2·1·GO" that Navi leads in sync on every attendee phone and the host's own screen (over SSE), then auto-starts the round as it hits GO
- CountdownOverlay (src/components/effects/countdown-overlay.tsx) — full-screen Navi-led overlay; she narrates each tick aloud when voice is on — driven by a useCountdown ticker hook (src/utils/use-countdown.ts)
- Countdown realtime message end-to-end: RealtimeMessage.Countdown, hub publishCountdown (one-off fan-out, not stored/replayed), publish-route handling, GameChannel.publishCountdown + useGameChannel onCountdown / publishCountdown
- ihhh-countdown-pop keyframe (globals.css, reduced-motion-guarded), NAVI_COUNTDOWN_* copy (src/constants/navi.ts), and GAME_CONFIG.countdownGoMs

## 2026-06-14

### Added
- Interactive Navi on the home hero: tap her for a springy bounce + sparkle burst + happy-mood flash and a playful one-liner that swaps into her speech bubble (spoken when voice is on); a first-time "tap me" hint
- Idle life: Navi now winks / glances on a random interval so she never looks frozen, plus a speaking mouth animation while she talks
- Navi's tips ticker (src/components/navigator/navi-tips.tsx): a rotating, phase-aware proactive-guidance line under the hero CTA — auto-advances, tap for another (read aloud when voice is on)
- Live-event reactions: Navi wiggles + exclaims a contextual line when the host advances the event phase, and when the live attendee headcount rises (throttled)
- NaviReaction enum + NAVI_CONFIG / NAVI_TIPS / NAVI_REACTIONS / NAVI_ARRIVAL_LINES / NAVI_PRESENCE_LINE (src/constants/navi.ts) and navi util helpers — getNaviTips / nextNaviReaction / getNaviArrivalLine / formatNaviPresence / estimateTalkMs (src/utils/navi.ts)
- navi- gesture keyframes (bounce / wiggle / wink / glance / talk / pop bubble / sparkle burst / tip swap) in globals.css, all disabled under prefers-reduced-motion
- Tap-to-react extended to the schedule guide and lobby coach Navis: tapping either plays the bounce + sparkle burst + happy-mood flash and swaps a playful one-liner into that screen's own intro/bubble
- Celebratory confetti burst on the Host Control Panel when the winner is announced — a pure-CSS/DOM ConfettiBurst (src/components/effects/confetti.tsx) in the brand palette, reduced-motion-safe; CELEBRATION tuning + ihhh-confetti keyframe (src/constants/host.ts, globals.css)
- Shared useNaviGestures() hook (src/utils/use-navi-gestures.ts) + a reusable TappableNavi button (src/components/navigator/tappable-navi.tsx) that centralize the tap / idle / reaction mechanics for every tappable Navi
- Room-wide winner celebration: when the host announces the winner, every onboarded attendee phone celebrates on whatever screen it's on — confetti + a 🏆 toast + Navi voicing the cheer (driven by AttendeeShell off the broadcast winnerName), and the home Navi cheers visually (wiggle + cheer line in her bubble). New WinnerContext/useWinnerName on AttendeeShell, NAVI_WINNER_CHEER + formatNaviWinner (src/constants/navi.ts, src/utils/navi.ts)

### Changed
- AvatarHost gained optional reaction / reactionKey / talking props (split eyes for a one-eyed wink, nested gesture layer so float + gesture compose, talking mouth, tap sparkle burst); its calm default is unchanged, so the other screens look identical
- NavigatorHero now composes the interactive NaviHost (which owns the avatar, attribution, speech bubble, and scripted-line voice) + NaviTips instead of a static AvatarHost
- NaviHost refactored to consume the shared useNaviGestures hook + TappableNavi (behavior unchanged); schedule-overview is now a client component and lobby-coach is interactive, both via the shared hook

## 2026-06-08

### Fixed
- Attendees could enter the live game round before the host started it or after it ended — entering /game/play (and the lobby "Join the round now" CTA) is now gated on canEnterGame: the event journey must be at the Game Session phase AND the host must have a live round running (Active / Boss); otherwise a Navi-led GameLocked screen / disabled CTA explains why and points back to the lobby
- Game Lobby and the home game-preview card now reflect the live host game status instead of the static mock seed (the "Live" badge no longer shows when no round is running)

### Added
- canEnterGame(phase, status) + getGameGateReason() gate helpers (src/utils/game.ts), a live useGameStatus() context on AttendeeShell (subscribes to host onState), and a GameScreen entry gate (src/components/game/game-screen.tsx) + GameLocked placeholder that wrap Screen 4; entry is latched so a mid-round host-end still shows the in-game summary
- Optional human voice for Navi via ElevenLabs cloud TTS: a server-only /api/voice route proxies scripted lines to ElevenLabs with the secret key (in-memory clip cache; runtime=nodejs), gated behind NEXT_PUBLIC_VOICE_PROVIDER=elevenlabs — Navi falls back to the free Web Speech voice automatically when no key is configured or a request fails
- VoiceProvider enum + VOICE_PROVIDER / VOICE_API_PATH / ELEVENLABS_CONFIG constants (src/constants/voice.ts) and an isVoiceSupported() helper; .env.example documents NEXT_PUBLIC_VOICE_PROVIDER + the server-only ELEVENLABS_API_KEY / ELEVENLABS_VOICE_ID

### Changed
- navi-voice util now routes speakLine() to the configured provider (ElevenLabs MP3 playback via the server route, else the browser voice), caches fetched clips by text, and stops in-flight audio on cancel

## 2026-06-07

### Added
- Live attendee headcount over SSE: the server tracks distinct connected attendee devices (refcounted per device so multiple tabs count once, the host excluded) and fans the count out as a Presence realtime message — replayed on connect; surfaced via AttendeeShell's usePlayerCount() and GameChannel/useGameChannel onPresence (attendees pass their playerId on the stream)
- Attendee onboarding: a Navi-led welcome step asks the attendee's name and shows an auto-allocated seat; the entered name + seat then drive the navigator persona (home/schedule/lobby/status) and the shared leaderboard handle, replacing the mock attendee
- Live event journey: the event phase is now host-driven shared state over SSE — the Host Control Panel (Screen 5) has an Event Journey control (advance to next / jump to any phase) and every attendee's Navi message, journey track, and schedule update live; the journey starts at phase 1 (Registered)
- Phase realtime message + hub state (publishPhase/getCurrentPhase with replay-on-connect), GameChannel.publishPhase / useGameChannel onPhase, and an attendee EventPhase context (AttendeeShell + useEventPhase)
- Per-device identity now persists an auto-allocated seat + onboarded flag (completeOnboarding) plus an attendeeFromIdentity helper; seat-allocation constants in src/constants/player.ts
- Shared live leaderboard: each attendee's score flows into one server-aggregated board that updates live on the Host Control Panel (Screen 5) — the host announces the winner from the real top scorer; the board freezes on lock and clears on reset
- Per-device player identity (stable id + auto-generated handle like "Swift Otter", persisted to localStorage) so the shared leaderboard shows distinct players across phones — src/utils/player-identity.ts (usePlayerIdentity) + src/constants/player.ts
- Score (attendee→server) + Leaderboard (server→all) realtime messages, the ScoreEntry type, and GameChannel.publishScore / useGameChannel onLeaderboard
- Realtime host→attendee sync: the Host Control Panel (Screen 5) now drives the attendee Virus Fight game (Screen 4) live — unleash the COVID Boss with a chosen shape, resume the round, and end the game, with a "Live · hosted from the control room" badge on the attendee screen
- Cross-device realtime over SSE: /api/game/stream (EventSource) + /api/game/publish route handlers backed by an in-memory server hub (src/server/game-hub.ts) — runs on a single server (Render-ready) so attendees on any device/network join over the public URL; no third-party realtime service
- GameChannel transport facade (src/utils/realtime.ts) selects SSE (default, cross-device) or BroadcastChannel (same-browser local-dev fallback) via NEXT_PUBLIC_REALTIME_TRANSPORT; useGameChannel hook (src/utils/use-game-channel.ts) is unchanged for callers
- Host-pushed reminders now surface as a toast + Navi voice line on any attendee screen (AttendeeRealtimeListener)
- REALTIME_CHANNEL + RealtimeMessage + RealtimeTransport constants and SSE/publish path constants (src/constants/realtime.ts), the GameSessionState type, and .env.example documenting NEXT_PUBLIC_REALTIME_TRANSPORT
- Navi voice via the Web Speech API: opt-in speaker toggle in the attendee header (persisted), Navi reads her scripted line on the home hero and calls out boss warning/defeat/escape/game-over + reminders during the game
- Voice constants (src/constants/voice.ts: VOICE_CONFIG, VOICE_PREF, VOICE_STORAGE_KEY) + navi-voice util (speakLine, useNaviVoice; src/utils/navi-voice.ts)

### Changed
- The home game-preview, the lobby hero, and the host status banner now show the live connected-attendee count (server-tracked presence) instead of the seeded 48 — labeled "online"; the lobby is now a thin server page rendering a live client orchestrator (LobbyScreen), and the lobby's stacked avatar faces are capped to the live count
- The home game-preview leaderboard peek now reads the shared live board (server-aggregated, via the AttendeeShell subscription + useLiveLeaderboard context), falling back to a no-"You" sample teaser only before any scores arrive
- The navigator persona (name, seat, check-in) now comes from the onboarded per-device identity instead of the mock attendee; the attendee home + schedule are thin server pages rendering live client orchestrators (host-driven phase), and the attendee shell owns a single realtime subscription (phase + reminders + leaderboard)
- Host leaderboard and the attendee in-round rank now read from the shared live board instead of mock data (the mock leaderboard remains only as a solo-play fallback for rank when no other players are present)

### Removed
- AttendeeRealtimeListener (folded into the new AttendeeShell, which owns the attendee-area realtime subscription)

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
