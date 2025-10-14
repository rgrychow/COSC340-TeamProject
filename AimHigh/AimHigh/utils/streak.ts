// utils/streak.ts
// Computes how many consecutive weeks (most-recent backwards) meet or exceed a weekly goal.
// Weeks are grouped Monday–Sunday to be consistent.

type Dated = { dateISO: string };

function weekKeyMonday(d: Date): string {
  // shift to Monday
  const day = d.getDay(); // 0 Sun .. 6 Sat
  const offset = (day + 6) % 7; // 0 if Monday
  const monday = new Date(d);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(d.getDate() - offset);
  return monday.toISOString().slice(0, 10); // YYYY-MM-DD
}

export function weeklyStreak(items: Dated[], goal = 4): number {
  if (items.length === 0) return 0;

  // count items per week
  const byWeek = new Map<string, number>();
  for (const it of items) {
    const key = weekKeyMonday(new Date(it.dateISO));
    byWeek.set(key, (byWeek.get(key) || 0) + 1);
  }

  // sort weeks descending (newest first)
  const weeks = [...byWeek.entries()].sort((a, b) =>
    a[0] < b[0] ? 1 : a[0] > b[0] ? -1 : 0
  );

  // ensure current week appears even if count is 0
  const nowKey = weekKeyMonday(new Date());
  if (!byWeek.has(nowKey)) {
    weeks.unshift([nowKey, 0]);
  }

  // count consecutive weeks meeting goal
  let streak = 0;
  for (const [, count] of weeks) {
    if (count >= goal) streak++;
    else break;
  }
  return streak;
}
