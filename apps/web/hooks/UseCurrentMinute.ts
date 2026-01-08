"use client";
import { useEffect, useState } from "react";
import { DateTime } from "luxon";

export function useCurrentMinute() {
  const [now, setNow] = useState(DateTime.now());

  useEffect(() => {
    function tick() {
      setNow(DateTime.now());
    }

    const now = DateTime.now();
    const msToNextMinute = (60 - now.second) * 1000 - now.millisecond;

    const timeout = setTimeout(() => {
      tick();
      const interval = setInterval(tick, 60 * 1000);
      return () => clearInterval(interval);
    }, msToNextMinute);

    return () => clearTimeout(timeout);
  }, []);

  return now;
}