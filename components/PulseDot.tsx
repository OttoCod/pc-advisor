export function PulseDot({ label }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping-ring absolute inline-flex h-full w-full rounded-full bg-good" />
        <span className="animate-pulse-dot relative inline-flex h-2 w-2 rounded-full bg-good" />
      </span>
      {label && <span className="text-xs text-fg-muted">{label}</span>}
    </span>
  );
}
