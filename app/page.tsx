'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimeCellEditor } from '@/components/AnimeCellEditor';
import { AnimeGrid } from '@/components/AnimeGrid';
import { ExportPanel } from '@/components/ExportPanel';
import { searchAnime, getAnimeDisplayTitle } from '@/lib/animeApi';
import { exportElementToPng } from '@/lib/exportImage';
import { AnimeSlot, AnimeSummary } from '@/types/anime';

const SLOT_COUNT = 9;
const DEBOUNCE_MS = 400;
const STORAGE_KEY = 'nine-animes-state-v1';

type PersistedSlot = {
  id: number;
  selectedAnime: AnimeSummary | null;
  comment: string;
};

type PersistedState = {
  title: string;
  slots: PersistedSlot[];
};

function createInitialSlots(): AnimeSlot[] {
  return Array.from({ length: SLOT_COUNT }, (_, i) => ({
    id: i + 1,
    selectedAnime: null,
    comment: '',
    searchQuery: '',
    searchResults: [],
    isSearching: false,
    error: null
  }));
}

function toPersistedState(title: string, slots: AnimeSlot[]): PersistedState {
  return {
    title,
    slots: slots.map((slot) => ({
      id: slot.id,
      selectedAnime: slot.selectedAnime,
      comment: slot.comment
    }))
  };
}

export default function HomePage() {
  const [title, setTitle] = useState('私を構成する9つのアニメ');
  const [slots, setSlots] = useState<AnimeSlot[]>(createInitialSlots());
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as PersistedState;
      if (parsed.title) setTitle(parsed.title);
      if (Array.isArray(parsed.slots)) {
        setSlots((current) =>
          current.map((slot) => {
            const found = parsed.slots.find((p) => p.id === slot.id);
            if (!found) return slot;
            return {
              ...slot,
              selectedAnime: found.selectedAnime,
              comment: found.comment || ''
            };
          })
        );
      }
    } catch {
      // ignore restore errors
    }
  }, []);

  useEffect(() => {
    const state = toPersistedState(title, slots);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [title, slots]);

  useEffect(() => {
    const timers = slots.map((slot) => {
      if (!slot.searchQuery.trim()) {
        if (slot.searchResults.length || slot.error || slot.isSearching) {
          setSlots((current) =>
            current.map((s) =>
              s.id === slot.id ? { ...s, searchResults: [], error: null, isSearching: false } : s
            )
          );
        }
        return null;
      }

      const timer = window.setTimeout(async () => {
        setSlots((current) =>
          current.map((s) => (s.id === slot.id ? { ...s, isSearching: true, error: null } : s))
        );

        try {
          const results = await searchAnime(slot.searchQuery);
          setSlots((current) =>
            current.map((s) =>
              s.id === slot.id
                ? {
                    ...s,
                    searchResults: results,
                    isSearching: false,
                    error: results.length ? null : '候補が見つかりませんでした。別表記でも試してください。'
                  }
                : s
            )
          );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : '検索に失敗しました。時間を空けて再試行してください。';
          setSlots((current) =>
            current.map((s) =>
              s.id === slot.id ? { ...s, isSearching: false, error: message, searchResults: [] } : s
            )
          );
        }
      }, DEBOUNCE_MS);

      return timer;
    });

    return () => {
      timers.forEach((timer) => {
        if (timer) window.clearTimeout(timer);
      });
    };
  }, [slots]);

  const shareText = useMemo(() => {
    const selected = slots
      .filter((slot) => slot.selectedAnime)
      .map((slot) => `${slot.id}. ${getAnimeDisplayTitle(slot.selectedAnime as AnimeSummary)}`)
      .join('\n');

    return `${title}\n\n${selected || '（まだ選択中）'}\n\n#私を構成する9つのアニメ`;
  }, [slots, title]);

  const updateSlot = (slotId: number, updater: (prev: AnimeSlot) => AnimeSlot): void => {
    setSlots((current) => current.map((slot) => (slot.id === slotId ? updater(slot) : slot)));
  };

  const handleQueryChange = (slotId: number, value: string): void => {
    updateSlot(slotId, (slot) => ({ ...slot, searchQuery: value }));
  };

  const handleSelectAnime = (slotId: number, anime: AnimeSummary): void => {
    updateSlot(slotId, (slot) => ({
      ...slot,
      selectedAnime: anime,
      searchQuery: getAnimeDisplayTitle(anime),
      searchResults: [],
      isSearching: false,
      error: null
    }));
  };

  const handleClearAnime = (slotId: number): void => {
    updateSlot(slotId, (slot) => ({
      ...slot,
      selectedAnime: null,
      searchQuery: '',
      searchResults: [],
      error: null,
      isSearching: false
    }));
  };

  const handleCommentChange = (slotId: number, value: string): void => {
    updateSlot(slotId, (slot) => ({ ...slot, comment: value }));
  };

  const handleExport = async (): Promise<void> => {
    if (!exportRef.current) return;
    setIsExporting(true);
    setExportError(null);
    try {
      await exportElementToPng(exportRef.current, 'my-9-anime.png');
    } catch {
      setExportError('画像エクスポートに失敗しました。画像の読み込み完了後に再試行してください。');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyShareText = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(shareText);
    } catch {
      setExportError('クリップボードへのコピーに失敗しました。ブラウザ設定をご確認ください。');
    }
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6 space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">9 Anime Builder</p>
        <h1 className="text-2xl font-bold text-slate-100 sm:text-3xl">私を構成する9つのアニメ</h1>
        <p className="text-sm text-slate-300">
          9作品を選んで1枚にまとめ、PNG保存できます。空欄セルがあってもエクスポート可能です。
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.05fr_1fr]">
        <section className="space-y-4 rounded-xl border border-slate-700 bg-slate-900/70 p-4">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-100">ページタイトル</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus:border-cyan-400"
            />
          </label>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {slots.map((slot) => (
              <AnimeCellEditor
                key={slot.id}
                slot={slot}
                onQueryChange={handleQueryChange}
                onSelectAnime={handleSelectAnime}
                onClearAnime={handleClearAnime}
                onCommentChange={handleCommentChange}
              />
            ))}
          </div>

          <ExportPanel
            onExport={handleExport}
            isExporting={isExporting}
            exportError={exportError}
            onCopyShareText={handleCopyShareText}
            shareText={shareText}
          />
        </section>

        <AnimeGrid title={title} slots={slots} exportRef={exportRef} />
      </div>
    </main>
  );
}
