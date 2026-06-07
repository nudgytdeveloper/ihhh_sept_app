# IHHH Event Navigator — Demo Tutorial

How to run a live, **cross-device** demo of the IHHH Event Navigator: the
presenter drives the **Host Control Panel** on one device, attendees play the
**Virus Fight** game live on their own phones, and everyone stays in sync over
the public URL — any network, no third-party services.

> **The one-liner:** deploy, open **`/host`** on the presenter's device and
> **`/game/play`** on each attendee's phone (cellular or venue Wi-Fi — doesn't
> matter, they sync through the server).

---

## 0. Before the room fills up (5-minute prep)

- [ ] App is deployed and you have the **public HTTPS URL** (see
      [Deploying for the demo](#deploying-for-the-demo)).
- [ ] Open **`<your-url>/host`** on the presenter device (laptop + projector is
      ideal — the leaderboard reads well on a big screen).
- [ ] Open **`<your-url>/game/play`** on one or two phones to smoke-test sync
      *before* the audience joins.
- [ ] On a phone, tap the **speaker toggle** in the attendee header once to hear
      Navi talk (voice is **off by default** — the text bubble always leads).
- [ ] Have the attendee URL ready to share as a **QR code** or short link.

Everything runs on a **single server instance** with an in-memory hub, so there
is nothing to configure and no accounts to create — just the URL.

---

## The 5 screens at a glance

| # | Screen | URL | Who opens it |
|---|--------|-----|--------------|
| 1 | Attendee Navigator Home | `/` | Attendees (the product story) |
| 2 | Event Schedule / Timeline | `/schedule` | Attendees |
| 3 | Game Lobby | `/game/lobby` | Attendees (pre-game) |
| 4 | Virus Fight Game | `/game/play` | **Attendees (play live)** |
| 5 | Host Game Control Panel | `/host` | **Presenter (drives everything)** |

The realtime links that matter: **`/host` → `/`** drives the event journey for
every attendee, and **`/host` → `/game/play`** drives the live game.

---

## Recommended demo flow (≈6–8 minutes)

### Act 1 — The product story (Screen 1, ~2 min)

Open **`/`** on a phone and mirror it for the room. The **first** time a device
opens the app, Navi runs a quick **welcome**: she greets the attendee, shows the
**seat she's auto-allocated** them, and asks for their name. Type a name and tap
**Enter the event** — that name + seat now personalize the whole app (and become
the attendee's handle on the live leaderboard). *(It's remembered per device, so
you only do this once per phone.)*

What to say: *"This isn't an ask-me-anything chatbot. It's an event host —
**Navi** — who speaks first and always gives one clear next step. Notice she
checked me in and gave me a seat before I asked anything."*

What to show:
- Navi's **scripted speech bubble** + the single **next-action CTA**.
- The **phase journey** track (Registered → Seated → Opening → Game Session →
  Buffet → Closing) with "Now / Up next".
- The **game preview card** (entry point + leaderboard peek + a live **"online"
  count** of attendees connected right now — the game itself lives on its own
  screen).
- Tap the **speaker toggle** so Navi reads her line aloud — a nice "wow" beat.

Optional: tap through to **`/schedule`** (Screen 2) to show the phase timeline,
then **`/game/lobby`** (Screen 3) to show the "who's in" lobby and how-to-play.

### Act 2 — The host guides the journey (Screen 5 → Screen 1, ~1 min)

This is the heart of the product: the host moves the whole room through the day,
and Navi leads each attendee to the next step — no one taps around looking for
what's next.

On the presenter device at **`/host`**, find the **Event journey** control at the
top. The journey starts at **phase 1 (Registered)**. Tap **Advance to Seated**
(or jump to any phase chip) and watch the attendee phones: Navi's message, the
**event-journey track**, and the **schedule** all update **live** — e.g. moving
to *Seated* changes her line to *"Your seat is ready."* Walk the room from
**Registered → Seated → Opening → Game Session**, narrating each handoff.

> The phase is shared live over the same server, so every connected phone (and
> any that join later) lands on the current phase automatically.

### Act 3 — Everyone joins the game (~1 min)

Ask the audience to open **`<your-url>/game/play`** on their phones (share the QR
/ link). Each phone shows the live round; when the host is connected they'll see
a **"Live · hosted from the control room"** badge.

Watch the **"online" count** climb in real time as phones connect — it shows on
the host status banner (**"N online"**) and on every attendee's home/lobby. A nice
beat: "that number is every phone in this room, live." It ticks back down as
people close the tab.

> No host action needed for them to join — the server replays the current
> session to every phone the moment it connects, in any order.

### Act 4 — The host drives the live game (Screen 5, ~3 min)

With the journey now on **Game Session** (Act 2), stay on the presenter device at
**`/host`** and run this exact sequence with the **game** controls below the
Event journey card — call out what the audience sees happen **on their own
phones** in real time:

1. **Start round** — every phone drops into the live round; mini-viruses start
   floating. Attendees **tap viruses for points** (+10 each). The HUD shows live
   score, rank, and a 60-second countdown. The **Live leaderboard** on your panel
   fills in as phones score — each player shows under their own handle (e.g.
   "Swift Otter"), re-ranking in real time. Point it out on the big screen.
2. **Spawn a mini-virus wave** (optional) — flood the arena for a beat of chaos.
3. **Unleash the COVID Boss** — pick a shape (**Circle / Star / Triangle /
   Square**) and unleash it. Every phone freezes the clock and shows
   *"Draw a {shape}…"*. Attendees **draw the shape with their finger** to defeat
   the boss for a **+250 bonus**. (Detection is intentionally forgiving — a
   genuine attempt passes; a dot or wrong shape doesn't.)
4. **Resume round** — the boss slips away and tapping resumes.
5. **Push a reminder** (e.g. *"Buffet is open · Zone C · Level 3"*) — it pops as
   a **toast + Navi voice line on every attendee screen**, whatever screen
   they're on. Great for showing the "proactive host" idea.
6. **End game** — all phones roll to the **round summary**.
7. **Lock leaderboard** → **Announce winner** — locking freezes the live scores
   for the final tally; announcing crowns the **real top scorer** with a 🏆 badge.
   Close on the leaderboard on the big screen.

Each host action also drops a timestamped line into the **activity log** and
fires a toast on the host panel, so the presenter has clear feedback too.

---

## Talking points (for Q&A)

- **"How does it sync with no backend service?"** The app serves its own
  realtime stream (Server-Sent Events) from a single web service. The host
  publishes session snapshots; the server fans them out to every connected
  phone and replays the latest state to anyone who joins late. No Supabase, no
  Socket.io account, no keys.
- **"Will it work on the venue's network?"** Phones connect to the **public
  URL**, so cellular or venue Wi-Fi both work — they don't need to be on the
  same local network.
- **"Is the avatar AI?"** For the demo Navi is a **rules-based Script Engine**
  driven by event phase, time, and host actions. Full AI can drop in later
  without changing the UX.
- **"Is the shape detection real?"** Yes — it's a real geometry heuristic
  (resample + roundness + corner count), tuned to be **convincing, not
  perfect**, which is exactly right for a crowd.

---

## Deploying for the demo

The app is a standard Next.js server — host it on **Render** (or any Node host)
as a **single web service**.

| Setting | Value |
|---------|-------|
| Build command | `npm install && npm run build` |
| Start command | `npm start` (`next start` — binds `0.0.0.0:$PORT`, which the host sets) |
| Env vars | **None required** — SSE cross-device is the default |
| Instances | **Exactly 1** (see below) |

> ⚠️ **Keep it to a single instance.** The realtime hub lives in memory, so do
> **not** enable autoscaling for the demo. (To scale out later, swap the
> in-memory hub for Redis pub/sub behind the same `GameChannel` seam — one file,
> no screen changes.)

> 💤 **Free-tier cold start:** free instances sleep when idle, so the *first*
> connection after a quiet period waits a few seconds to wake (the attendee's
> EventSource auto-reconnects). For a live audience, use a **paid instance** or
> hit the URL a minute before you start to warm it up.

There is nothing else to configure — `NEXT_PUBLIC_REALTIME_TRANSPORT` defaults to
`sse`, which is the cross-device path.

---

## Local fallback (no deploy)

You can run the whole demo on **one machine** with two browser windows:

```bash
npm run build && npm start    # production server on http://localhost:3000
# or for development:
npm run dev
```

Then open:
- `http://localhost:3000/host` in one window
- `http://localhost:3000/game/play` in another

The default **SSE transport** syncs them through your local server (this is what
the projector mirror would use). If you want a **fully offline, same-browser**
demo with no server round-trips, set `NEXT_PUBLIC_REALTIME_TRANSPORT=broadcast`
before building — but for anything cross-device, **leave it on `sse`**.

---

## Quick troubleshooting

| Symptom | Fix |
|---------|-----|
| Phones don't react to host actions | Confirm both are on the **same deployed URL** (not a mix of localhost + deployed). |
| Attendee joins and sees the wrong/old state | The server replays the **last** snapshot — if it looks stale, the host should re-tap a control (e.g. **Reset** / **Start round**) to publish a fresh state. |
| First attendee to connect hangs a few seconds | Free-tier **cold start** — it auto-reconnects; warm the URL beforehand or use a paid instance. |
| No "Live · hosted from the control room" badge | The **`/host`** tab isn't open/connected — open it and take any action. With no host connected, the round still auto-runs standalone. |
| Navi isn't speaking | Voice is **off by default** — tap the **speaker toggle** in the attendee header (some browsers need one user tap before audio is allowed). |
| Want to re-run the demo | On `/host`, hit **Reset**, then **Start round** again. |

---

## What's mock vs. live (be honest in the room)

- **Live & cross-device:** the **attendee persona** (name they enter at the
  welcome step + auto-allocated seat + check-in), the **event journey phase**
  (host-driven — advancing it updates every attendee's Navi, journey track, and
  schedule live), host → attendee game control (start/boss/resume/end/lock),
  reminders, the per-attendee round (tapping, boss draw, score, HUD), the
  **shared leaderboard** (every phone's score pools into one server-aggregated
  board that re-ranks live, freezes on lock, and clears on reset — shown on both
  the host panel **and** the home screen's leaderboard peek), the **"online"
  headcount** (a real count of connected attendee devices — server-tracked, the
  host excluded — shown live on the home preview, the lobby, and the host panel;
  it rises and falls as phones join and leave), and Navi's voice + scripted lines.
  The entered name doubles as the player's leaderboard handle, so players are
  distinct on the board.
- **Demo seed data:** the **schedule times** (8:30 AM, 9:00 AM, …) are seeded,
  and the home peek shows a small **sample top-3** only until real scores arrive
  (then it flips to the live shared board).

> Note: the shared leaderboard and the live headcount are both server-side, so
> they need the SSE transport (the default on Render and in local two-window dev).
> The optional same-browser `broadcast` fallback has no server to pool scores or
> count attendees.
