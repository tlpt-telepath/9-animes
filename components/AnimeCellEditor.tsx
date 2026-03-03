import { AnimeSlot, AnimeSummary } from '@/types/anime';
import { getAnimeDisplayTitle } from '@/lib/animeApi';
import { AnimeSearchInput } from './AnimeSearchInput';

type AnimeCellEditorProps = {
  slot: AnimeSlot;
  onQueryChange: (slotId: number, value: string) => void;
  onSelectAnime: (slotId: number, anime: AnimeSummary) => void;
  onClearAnime: (slotId: number) => void;
};

export function AnimeCellEditor({
  slot,
  onQueryChange,
  onSelectAnime,
  onClearAnime
}: AnimeCellEditorProps) {
  return (
    <article className="rounded-lg border border-slate-700 bg-slate-900/60 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-100">#{slot.id}</h3>
        {slot.selectedAnime && (
          <button
            type="button"
            onClick={() => onClearAnime(slot.id)}
            className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:bg-slate-700"
          >
            解除
          </button>
        )}
      </div>

      <AnimeSearchInput
        query={slot.searchQuery}
        onQueryChange={(value) => onQueryChange(slot.id, value)}
        results={slot.searchResults}
        isSearching={slot.isSearching}
        error={slot.error}
        onSelect={(anime) => onSelectAnime(slot.id, anime)}
      />

      <div className="mt-3 space-y-2">
        <p className="text-xs text-slate-300">
          選択中: {slot.selectedAnime ? getAnimeDisplayTitle(slot.selectedAnime) : 'なし'}
        </p>
      </div>
    </article>
  );
}
