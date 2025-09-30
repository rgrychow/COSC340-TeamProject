// utils/date.ts
export function formatDateTime(dateISO: string) {
  const dt = new Date(dateISO);
  const datePart = dt.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timePart = dt.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${datePart}  ${timePart}`;
}

export function formatRelativeTime(dateISO: string) {
  const dt = new Date(dateISO);
  const now = new Date();
  const diff = (now.getTime() - dt.getTime()) / 1000; // seconds

  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

