import { AnimeSummary } from '@/types/anime';
import { getAnimeDisplayTitle } from '@/lib/animeApi';

type AnimeSearchInputProps = {
  query: string;
  onQueryChange: (value: string) => void;
  results: AnimeSummary[];
  isSearching: boolean;
  error: string | null;
  onSelect: (anime: AnimeSummary) => void;
};

export function AnimeSearchInput({
  query,
  onQueryChange,
  results,
  isSearching,
  error,
  onSelect
}: AnimeSearchInputProps) {
  return (
    <div className="space-y-2">
      <input
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="作品名で検索（日本語推奨）"
        className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus:border-cyan-400"
      />

      {isSearching && <p className="text-xs text-cyan-300">検索中...</p>}
      {error && <p className="text-xs text-rose-300">{error}</p>}

      {results.length > 0 && (
        <ul className="max-h-48 overflow-auto rounded-md border border-slate-700 bg-slate-900/90">
          {results.map((anime) => (
            <li key={anime.id}>
              <button
                type="button"
                onClick={() => onSelect(anime)}
                className="w-full border-b border-slate-800 px-3 py-2 text-left text-xs hover:bg-slate-800/80"
              >
                <p className="font-semibold text-slate-100">{getAnimeDisplayTitle(anime)}</p>
                <p className="text-slate-300">
                  {anime.title}
                  {anime.titleEnglish ? ` / ${anime.titleEnglish}` : ''}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
