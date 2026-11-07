export function duration(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

export function minutesAgo(since: Date, now: Date): string {
  const minutes = Math.floor((now.getTime() - since.getTime()) / 60_000);
  if (minutes < 1) return 'gerade eben';
  return minutes === 1 ? 'vor 1 Minute' : `vor ${minutes} Minuten`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}
