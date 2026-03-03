export type AnimeSummary = {
  id: number;
  title: string;
  titleJapanese: string | null;
  titleEnglish: string | null;
  imageUrl: string | null;
};

export type AnimeSlot = {
  id: number;
  selectedAnime: AnimeSummary | null;
  comment: string;
  searchQuery: string;
  searchResults: AnimeSummary[];
  isSearching: boolean;
  error: string | null;
};
