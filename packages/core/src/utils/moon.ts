/**
 * Calculate the next new moon date on or after the given date.
 * Uses a simplified astronomical algorithm accurate to within a day or two.
 */

export interface MoonEvent {
  date: Date;
  phase: "new" | "first_quarter" | "full" | "last_quarter";
}

// Days between new moons (synodic month)
const SYNODIC_MONTH = 29.53058867;

// Known new moon: 6 January 2000 at 18:14 UTC (J2000.0 epoch reference)
const KNOWN_NEW_MOON = new Date(Date.UTC(2000, 0, 6, 18, 14, 0));

export function getNextNewMoon(from: Date = new Date()): Date {
  const fromUtc = Date.UTC(
    from.getFullYear(),
    from.getMonth(),
    from.getDate(),
    from.getHours(),
    from.getMinutes()
  );

  const daysSinceKnown = (fromUtc - KNOWN_NEW_MOON.getTime()) / (1000 * 60 * 60 * 24);
  const cyclesSinceKnown = Math.floor(daysSinceKnown / SYNODIC_MONTH);
  let nextNewMoonDays = (cyclesSinceKnown + 1) * SYNODIC_MONTH;

  // Fine-tune by subtracting/adding small amounts until we pass `from`
  while (nextNewMoonDays < daysSinceKnown) {
    nextNewMoonDays += SYNODIC_MONTH;
  }

  const nextNewMoonTime = KNOWN_NEW_MOON.getTime() + nextNewMoonDays * 24 * 60 * 60 * 1000;
  return new Date(nextNewMoonTime);
}

export function getPreviousNewMoon(from: Date = new Date()): Date {
  const next = getNextNewMoon(from);
  return new Date(next.getTime() - SYNODIC_MONTH * 24 * 60 * 60 * 1000);
}

export function formatNewMoon(date: Date): string {
  return date.toLocaleDateString("en-AU", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
