function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

type Props = {
  text: string;
  query: string;
  active: boolean;
  className?: string;
};

export function SearchHighlightedText({ text, query, active, className }: Props) {
  const normalizedQuery = query.trim();
  if (!active || !normalizedQuery) {
    return <span className={className}>{text}</span>;
  }

  const parts = text.split(new RegExp(`(${escapeRegex(normalizedQuery)})`, "gi"));

  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.toLowerCase() === normalizedQuery.toLowerCase() ? (
          <mark
            key={i}
            className="rounded-sm bg-violet-950 text-violet-100 ring-1 ring-violet-600/60"
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
}
