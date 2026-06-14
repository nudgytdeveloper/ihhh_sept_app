# Changelog

## 2026-06-14

### Added
- Interactive Navi on the home hero: tap her for a springy bounce + sparkle burst + happy-mood flash and a playful one-liner that swaps into her speech bubble (spoken when voice is on); a first-time "tap me" hint
- Idle life: Navi now winks / glances on a random interval so she never looks frozen, plus a speaking mouth animation while she talks
- Navi's tips ticker (src/components/navigator/navi-tips.tsx): a rotating, phase-aware proactive-guidance line under the hero CTA — auto-advances, tap for another (read aloud when voice is on)
- Live-event reactions: Navi wiggles + exclaims a contextual line when the host advances the event phase, and when the live attendee headcount rises (throttled)
- NaviReaction enum + NAVI_CONFIG / NAVI_TIPS / NAVI_REACTIONS / NAVI_ARRIVAL_LINES / NAVI_PRESENCE_LINE (src/constants/navi.ts) and navi util helpers — getNaviTips / nextNaviReaction / getNaviArrivalLine / formatNaviPresence / estimateTalkMs (src/utils/navi.ts)
- navi- gesture keyframes (bounce / wiggle / wink / glance / talk / pop bubble / sparkle burst / tip swap) in globals.css, all disabled under prefers-reduced-motion

### Changed
- AvatarHost gained optional reaction / reactionKey / talking props (split eyes for a one-eyed wink, nested gesture layer so float + gesture compose, talking mouth, tap sparkle burst); its calm default is unchanged, so the other screens look identical
- NavigatorHero now composes the interactive NaviHost (which owns the avatar, attribution, speech bubble, and scripted-line voice) + NaviTips instead of a static AvatarHost

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
