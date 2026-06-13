/**
 * Branded loading spinner (gold accent). Replaces the inline spinner markup
 * that was duplicated across the loading states of several screens.
 */
export function Spinner({ className = "" }: { className?: string }) {
  return (
    <div
      className={`h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-gold ${className}`}
    />
  );
}
