// Timezone helpers. All "local" values are in the configured timezone (PRD §01).

export interface LocalParts { year: number; month: number; day: number; hour: number; minute: number; second: number; weekday: number }

const fmtCache = new Map<string, Intl.DateTimeFormat>();
function formatter(tz: string): Intl.DateTimeFormat {
  let f = fmtCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23', weekday: 'short',
    });
    fmtCache.set(tz, f);
  }
  return f;
}
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function localParts(instant: Date, tz: string): LocalParts {
  const p = Object.fromEntries(formatter(tz).formatToParts(instant).map((x) => [x.type, x.value]));
  return {
    year: Number(p.year), month: Number(p.month), day: Number(p.day),
    hour: Number(p.hour), minute: Number(p.minute), second: Number(p.second), weekday: WEEKDAYS.indexOf(p.weekday),
  };
}

/** Offset (ms) of `tz` from UTC at `instant`. */
function offsetAt(instant: Date, tz: string): number {
  const p = localParts(instant, tz);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

/** The instant of a local wall-clock time in `tz`. */
export function fromLocal(year: number, month: number, day: number, h: number, m: number, s: number, ms: number, tz: string): Date {
  const guess = Date.UTC(year, month - 1, day, h, m, s, ms);
  let t = guess - offsetAt(new Date(guess), tz);
  t = guess - offsetAt(new Date(t), tz); // second pass handles DST edges
  return new Date(t);
}

/** Calendar date (UTC-noon anchored, safe for day arithmetic) of an instant in `tz`. */
export function localDate(instant: Date, tz: string): { year: number; month: number; day: number; weekday: number } {
  const p = localParts(instant, tz);
  return { year: p.year, month: p.month, day: p.day, weekday: p.weekday };
}

export function addDays(d: { year: number; month: number; day: number }, n: number) {
  const x = new Date(Date.UTC(d.year, d.month - 1, d.day + n, 12));
  return { year: x.getUTCFullYear(), month: x.getUTCMonth() + 1, day: x.getUTCDate(), weekday: x.getUTCDay() };
}

export function isoDate(d: { year: number; month: number; day: number }): string {
  return `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
}
