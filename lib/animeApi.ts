import { AnimeSummary } from '@/types/anime';

type JikanAnimeItem = {
  mal_id: number;
  title: string;
  title_japanese: string | null;
  title_english: string | null;
  images?: {
    jpg?: {
      image_url?: string;
      large_image_url?: string;
    };
    webp?: {
      image_url?: string;
      large_image_url?: string;
    };
  };
};

type JikanSearchResponse = {
  data: JikanAnimeItem[];
};

type AniListMedia = {
  id: number;
  title: {
    romaji: string | null;
    english: string | null;
    native: string | null;
  };
  coverImage?: {
    extraLarge?: string | null;
    large?: string | null;
    medium?: string | null;
  };
};

type AniListResponse = {
  data?: {
    Page?: {
      media?: AniListMedia[];
    };
  };
  errors?: Array<{ message: string }>;
};

const API_BASE = 'https://api.jikan.moe/v4';
const ANILIST_API_BASE = 'https://graphql.anilist.co';
const memoryCache = new Map<string, AnimeSummary[]>();
const CACHE_KEY = 'anime-search-cache-v1';

function normalizeAnime(item: JikanAnimeItem): AnimeSummary {
  const imageUrl =
    item.images?.webp?.large_image_url ||
    item.images?.jpg?.large_image_url ||
    item.images?.webp?.image_url ||
    item.images?.jpg?.image_url ||
    null;

  return {
    id: item.mal_id,
    title: item.title,
    titleJapanese: item.title_japanese,
    titleEnglish: item.title_english,
    imageUrl
  };
}

function getDisplayTitle(anime: AnimeSummary): string {
  return anime.titleJapanese || anime.title || anime.titleEnglish || 'タイトル不明';
}

function normalizeText(text: string): string {
  return text.toLowerCase().trim();
}

function rankByJapanesePreference(anime: AnimeSummary, query: string): number {
  const q = normalizeText(query);
  const jp = normalizeText(anime.titleJapanese || '');
  const base = normalizeText(anime.title || '');
  const en = normalizeText(anime.titleEnglish || '');

  if (jp === q) return 0;
  if (jp.startsWith(q)) return 1;
  if (jp.includes(q)) return 2;
  if (base === q) return 3;
  if (base.startsWith(q)) return 4;
  if (base.includes(q)) return 5;
  if (en === q) return 6;
  if (en.startsWith(q)) return 7;
  if (en.includes(q)) return 8;
  return 100;
}

function clientFilterAndSort(items: AnimeSummary[], query: string): AnimeSummary[] {
  const q = normalizeText(query);
  const filtered = items.filter((anime) => {
    const candidates = [anime.titleJapanese, anime.title, anime.titleEnglish]
      .filter(Boolean)
      .map((v) => normalizeText(String(v)));
    return candidates.some((candidate) => candidate.includes(q));
  });

  return filtered.sort((a, b) => {
    const aRank = rankByJapanesePreference(a, query);
    const bRank = rankByJapanesePreference(b, query);
    if (aRank !== bRank) return aRank - bRank;
    return getDisplayTitle(a).localeCompare(getDisplayTitle(b), 'ja');
  });
}

function loadSessionCache(): Record<string, AnimeSummary[]> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, AnimeSummary[]>;
  } catch {
    return {};
  }
}

function saveSessionCache(cache: Record<string, AnimeSummary[]>): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore session storage write errors
  }
}

async function searchWithJikan(query: string): Promise<AnimeSummary[]> {
  const url = `${API_BASE}/anime?q=${encodeURIComponent(query)}&limit=12&sfw=true&order_by=score&sort=desc`;
  const response = await fetch(url, { method: 'GET' });
  if (!response.ok) {
    throw new Error('jikan_non_ok');
  }

  const json = (await response.json()) as JikanSearchResponse;
  const normalized = (json.data || []).map(normalizeAnime);
  return clientFilterAndSort(normalized, query).slice(0, 8);
}

function normalizeAniListAnime(item: AniListMedia): AnimeSummary {
  const imageUrl = item.coverImage?.extraLarge || item.coverImage?.large || item.coverImage?.medium || null;
  return {
    id: item.id,
    title: item.title.romaji || item.title.english || item.title.native || 'タイトル不明',
    titleJapanese: item.title.native,
    titleEnglish: item.title.english,
    imageUrl
  };
}

async function searchWithAniList(query: string): Promise<AnimeSummary[]> {
  const requestBody = {
    query:
      'query ($search: String, $perPage: Int) { Page(perPage: $perPage) { media(search: $search, type: ANIME, isAdult: false, sort: POPULARITY_DESC) { id title { romaji english native } coverImage { extraLarge large medium } } } }',
    variables: {
      search: query,
      perPage: 12
    }
  };

  const response = await fetch(ANILIST_API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    throw new Error('anilist_non_ok');
  }

  const json = (await response.json()) as AniListResponse;
  if (json.errors?.length) {
    throw new Error('anilist_graphql_error');
  }

  const normalized = (json.data?.Page?.media || []).map(normalizeAniListAnime);
  return clientFilterAndSort(normalized, query).slice(0, 8);
}

export async function searchAnime(query: string): Promise<AnimeSummary[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const key = normalizeText(trimmed);

  if (memoryCache.has(key)) {
    return memoryCache.get(key) || [];
  }

  const sessionCache = loadSessionCache();
  if (sessionCache[key]) {
    memoryCache.set(key, sessionCache[key]);
    return sessionCache[key];
  }

  try {
    const optimized = await searchWithJikan(trimmed);
    memoryCache.set(key, optimized);
    sessionCache[key] = optimized;
    saveSessionCache(sessionCache);
    return optimized;
  } catch {
    try {
      const optimized = await searchWithAniList(trimmed);
      memoryCache.set(key, optimized);
      sessionCache[key] = optimized;
      saveSessionCache(sessionCache);
      return optimized;
    } catch {
      throw new Error('検索通信に失敗しました。時間を空けて再試行してください。');
    }
  }
}

export function getAnimeDisplayTitle(anime: AnimeSummary): string {
  return getDisplayTitle(anime);
}
