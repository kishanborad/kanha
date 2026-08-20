// frontend/src/components/apps/search/ResultCard.tsx
import type { SearchResult } from '../../../types';

interface ResultCardProps {
  result: SearchResult;
  onAskKanha: (result: SearchResult) => void;
}

function faviconUrl(url: string): string {
  try {
    const { hostname } = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=16`;
  } catch {
    return '';
  }
}

function friendlyUrl(url: string): string {
  try {
    const { hostname, pathname } = new URL(url);
    const path = pathname.length > 30 ? pathname.slice(0, 30) + '…' : pathname;
    return hostname + path;
  } catch {
    return url;
  }
}

export default function ResultCard({ result, onAskKanha }: ResultCardProps) {
  const favicon = faviconUrl(result.url);

  return (
    <div className="glass-panel rounded-xl p-3 border border-z-border hover:border-z-border/60 transition-all group">
      {/* Title row */}
      <div className="flex items-start gap-2 mb-1">
        {favicon && (
          <img
            src={favicon}
            alt=""
            width={14}
            height={14}
            className="mt-0.5 shrink-0 opacity-70"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        )}
        <a
          href={result.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-z-primary hover:text-z-primary/80 leading-snug transition-colors line-clamp-2"
        >
          {result.title}
        </a>
      </div>

      {/* URL */}
      <p className="text-[10px] font-mono text-z-dimmed mb-1.5 truncate pl-4">
        {friendlyUrl(result.url)}
      </p>

      {/* Snippet */}
      <p className="text-[11px] text-z-text/80 leading-relaxed line-clamp-3 mb-2">
        {result.snippet}
      </p>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-mono text-z-dimmed/60">via {result.engine}</span>
        <button
          onClick={() => onAskKanha(result)}
          className="text-[10px] font-mono px-2 py-0.5 rounded border border-z-secondary/30 text-z-secondary hover:bg-z-secondary/10 transition-colors opacity-0 group-hover:opacity-100"
        >
          Ask Kanha
        </button>
      </div>
    </div>
  );
}
