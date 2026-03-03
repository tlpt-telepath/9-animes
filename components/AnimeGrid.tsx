import { AnimeSlot } from '@/types/anime';
import { getAnimeDisplayTitle } from '@/lib/animeApi';

type AnimeGridProps = {
  title: string;
  slots: AnimeSlot[];
  exportRef: React.RefObject<HTMLDivElement | null>;
};

export function AnimeGrid({ title, slots, exportRef }: AnimeGridProps) {
  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900/70 p-4 shadow-xl shadow-cyan-900/20">
      <div
        ref={exportRef}
        className="mx-auto w-full max-w-[760px] rounded-xl border border-slate-600 bg-slate-950 p-4"
      >
        <h1 className="mb-4 text-center text-xl font-bold tracking-wide text-slate-100 sm:text-2xl">
          {title || '私を構成する9つのアニメ'}
        </h1>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {slots.map((slot, index) => {
            const anime = slot.selectedAnime;
            const displayTitle = anime ? getAnimeDisplayTitle(anime) : '未選択';

            return (
              <article
                key={slot.id}
                className="relative overflow-hidden rounded-lg border border-slate-700 bg-slate-800"
              >
                <div className="aspect-square">
                  {anime?.imageUrl ? (
                    // next/image is intentionally avoided here to keep static export and remote image handling simple.
                    <img
                      src={anime.imageUrl}
                      alt={displayTitle}
                      className="h-full w-full object-cover"
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-700 text-center text-xs text-slate-300 sm:text-sm">
                      No Image
                    </div>
                  )}
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-black/20 p-2">
                  <p className="line-clamp-2 text-xs font-semibold text-slate-100 sm:text-sm">
                    {index + 1}. {displayTitle}
                  </p>
                  {slot.comment && (
                    <p className="mt-1 line-clamp-2 text-[10px] text-slate-200 sm:text-xs">{slot.comment}</p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
