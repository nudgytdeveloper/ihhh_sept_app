"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GAME_CONFIG } from "@/constants/game";

/** Display value of the synchronized countdown: a number, "go", or null (idle). */
export type CountdownValue = number | "go" | null;

export interface Countdown {
  value: CountdownValue;
  start: (seconds: number) => void;
}

/**
 * A local "3·2·1·GO" ticker. `start(seconds)` kicks it off — it ticks down once
 * per second, flashes "go", then clears itself. Because every device calls
 * `start()` the instant the same realtime countdown message arrives (fanned out
 * over SSE), the countdowns line up across phones without any clock-sync.
 *
 * `start` is referentially stable, so it can be called straight from a realtime
 * message handler.
 */
export function useCountdown(): Countdown {
  const [value, setValue] = useState<CountdownValue>(null);
  const timers = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }, []);

  const start = useCallback(
    (seconds: number) => {
      clearTimers();
      const n = Math.max(1, Math.floor(seconds));
      setValue(n);
      // n-1 intermediate ticks (n-1 … 1)
      for (let i = 1; i < n; i++) {
        timers.current.push(window.setTimeout(() => setValue(n - i), i * 1000));
      }
      // …then "GO!", then clear.
      timers.current.push(window.setTimeout(() => setValue("go"), n * 1000));
      timers.current.push(
        window.setTimeout(() => setValue(null), n * 1000 + GAME_CONFIG.countdownGoMs),
      );
    },
    [clearTimers],
  );

  useEffect(() => clearTimers, [clearTimers]);

  return { value, start };
}
