'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimeCellEditor } from '@/components/AnimeCellEditor';
import { AnimeGrid } from '@/components/AnimeGrid';
import { ExportPanel } from '@/components/ExportPanel';
import { searchAnime, getAnimeDisplayTitle } from '@/lib/animeApi';
import { AnimeSlot, AnimeSummary } from '@/types/anime';

const SLOT_COUNT = 9;
const DEBOUNCE_MS = 400;
const STORAGE_KEY = 'nine-animes-state-v1';
const SHORT_TOTAL_MAX_LENGTH = 140;
const SHARE_HASHTAG = '#私を構成する9つのアニメ';
const SHARE_URL = 'https://tlpt-telepath.github.io/9-animes/';

type ShareMode = 'full' | 'short';

type PersistedSlot = {
  id: number;
  selectedAnime: AnimeSummary | null;
};

type PersistedState = {
  title: string;
  slots: PersistedSlot[];
};

function createInitialSlots(): AnimeSlot[] {
  return Array.from({ length: SLOT_COUNT }, (_, i) => ({
    id: i + 1,
    selectedAnime: null,
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
      selectedAnime: slot.selectedAnime
    }))
  };
}

function normalizeQuery(text: string): string {
  return text.trim().toLowerCase();
}

function composeShareText(body: string): string {
  return `${SHARE_HASHTAG}\n\n${body}\n\n${SHARE_URL}`;
}

function buildShortShareText(lines: string[]): string {
  const baseLines = lines.length ? lines : ['1. （まだ選択中）'];
  const fixedLength = composeShareText('').length;
  const bodyBudget = SHORT_TOTAL_MAX_LENGTH - fixedLength;
  if (bodyBudget <= 0) return `${SHARE_HASHTAG}\n\n${SHARE_URL}`;

  const result: string[] = [];
  let bodyLength = 0;

  for (let i = 0; i < baseLines.length; i += 1) {
    const line = baseLines[i];
    const lineWithBreak = result.length ? `\n${line}` : line;

    if (bodyLength + lineWithBreak.length <= bodyBudget) {
      result.push(line);
      bodyLength += lineWithBreak.length;
      continue;
    }

    const prefixMatch = line.match(/^(\d+\.\s*)/);
    const prefix = prefixMatch ? prefixMatch[1] : `${i + 1}. `;
    const remaining = bodyBudget - bodyLength - (result.length ? 1 : 0);
    if (remaining > prefix.length + 1) {
      const titleRoom = remaining - prefix.length - 1;
      const rawTitle = line.replace(/^(\d+\.\s*)/, '');
      result.push(`${prefix}${rawTitle.slice(0, titleRoom)}…`);
    } else if (!result.length) {
      result.push(`${prefix.slice(0, Math.max(0, remaining - 1))}…`);
    }
    break;
  }

  let text = composeShareText(result.join('\n'));
  if (text.length <= SHORT_TOTAL_MAX_LENGTH) return text;

  let body = result.join('\n');
  while (text.length > SHORT_TOTAL_MAX_LENGTH && body.length > 1) {
    body = `${body.slice(0, -2)}…`;
    text = composeShareText(body);
  }
  return text;
}

export default function HomePage() {
  const [title, setTitle] = useState('私を構成する9つのアニメ');
  const [slots, setSlots] = useState<AnimeSlot[]>(createInitialSlots());
  const [copyError, setCopyError] = useState<string | null>(null);
  const [shareMode, setShareMode] = useState<ShareMode>('full');

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
              selectedAnime: found.selectedAnime
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
      const selectedTitle = slot.selectedAnime ? getAnimeDisplayTitle(slot.selectedAnime) : '';
      const isSelectedTitleQuery =
        Boolean(slot.selectedAnime) &&
        normalizeQuery(slot.searchQuery) === normalizeQuery(selectedTitle);

      if (isSelectedTitleQuery) {
        if (slot.searchResults.length || slot.error || slot.isSearching) {
          setSlots((current) =>
            current.map((s) =>
              s.id === slot.id ? { ...s, searchResults: [], error: null, isSearching: false } : s
            )
          );
        }
        return null;
      }

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

  const shareLines = useMemo(
    () =>
      slots
        .filter((slot) => slot.selectedAnime)
        .map((slot) => `${slot.id}. ${getAnimeDisplayTitle(slot.selectedAnime as AnimeSummary)}`),
    [slots]
  );

  const fullShareText = useMemo(
    () => composeShareText(shareLines.length ? shareLines.join('\n') : '1. （まだ選択中）'),
    [shareLines]
  );
  const shortShareText = useMemo(() => buildShortShareText(shareLines), [shareLines]);
  const activeShareText = shareMode === 'short' ? shortShareText : fullShareText;

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

  const handleCopyShareText = async (): Promise<void> => {
    setCopyError(null);
    try {
      await navigator.clipboard.writeText(activeShareText);
    } catch {
      setCopyError('クリップボードへのコピーに失敗しました。ブラウザ設定をご確認ください。');
    }
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6 space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">9 Anime Builder</p>
        <h1 className="text-2xl font-bold text-slate-100 sm:text-3xl">私を構成する9つのアニメ</h1>
        <p className="text-sm text-slate-300">
          9作品を選んで一覧化し、シェア文を作成できます。
          <br />
          作者：
          <a
            href="https://x.com/tlpt_telepath"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 text-cyan-300 underline decoration-cyan-400/60 underline-offset-2 hover:text-cyan-200"
          >
            @tlpt_telepath
          </a>
          <br />
          音楽版は
          <a
            href="https://tlpt-telepath.github.io/9-musics/"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 text-cyan-300 underline decoration-cyan-400/60 underline-offset-2 hover:text-cyan-200"
          >
            こちら
          </a>
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
              />
            ))}
          </div>

          <ExportPanel
            onCopyShareText={handleCopyShareText}
            fullShareText={fullShareText}
            shortShareText={shortShareText}
            shareMode={shareMode}
            onChangeShareMode={setShareMode}
            copyError={copyError}
          />
        </section>

        <AnimeGrid title={title} slots={slots} />
      </div>
    </main>
  );
}
