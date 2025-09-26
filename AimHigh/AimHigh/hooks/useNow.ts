// hooks/useNow.ts
import { useState, useEffect } from "react";

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}

