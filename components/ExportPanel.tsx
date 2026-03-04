type ExportPanelProps = {
  onCopyShareText: () => void;
  fullShareText: string;
  shortShareText: string;
  shareMode: 'full' | 'short';
  onChangeShareMode: (mode: 'full' | 'short') => void;
  copyError: string | null;
};

export function ExportPanel({
  onCopyShareText,
  fullShareText,
  shortShareText,
  shareMode,
  onChangeShareMode,
  copyError
}: ExportPanelProps) {
  const FULL_LIMIT = 280;
  const SHORT_LIMIT = 140;
  const activeShareText = shareMode === 'short' ? shortShareText : fullShareText;
  const limit = shareMode === 'short' ? SHORT_LIMIT : FULL_LIMIT;
  const isOverLimit = activeShareText.length > limit;

  return (
    <section className="space-y-3 rounded-lg border border-slate-700 bg-slate-900/60 p-4">
      {copyError && <p className="text-xs text-rose-300">{copyError}</p>}

      <div className="rounded-md border border-slate-700 p-3">
        <p className="mb-2 text-xs text-slate-300">X向けシェア文（任意）</p>
        <div className="mb-3 flex gap-2">
          <button
            type="button"
            onClick={() => onChangeShareMode('full')}
            className={`rounded border px-3 py-1 text-xs ${
              shareMode === 'full'
                ? 'border-cyan-400 bg-cyan-400/20 text-cyan-200'
                : 'border-slate-600 text-slate-200 hover:bg-slate-700'
            }`}
          >
            フル版
          </button>
          <button
            type="button"
            onClick={() => onChangeShareMode('short')}
            className={`rounded border px-3 py-1 text-xs ${
              shareMode === 'short'
                ? 'border-cyan-400 bg-cyan-400/20 text-cyan-200'
                : 'border-slate-600 text-slate-200 hover:bg-slate-700'
            }`}
          >
            短縮版
          </button>
        </div>
        <p className="mb-2 text-[11px] text-slate-300">
          文字数: {activeShareText.length}/{limit}
          {isOverLimit ? '（制限超過）' : ''}
        </p>
        <p className="mb-3 whitespace-pre-wrap text-xs text-slate-100">{activeShareText}</p>
        <button
          type="button"
          onClick={onCopyShareText}
          className="rounded border border-slate-600 px-3 py-1 text-xs text-slate-100 hover:bg-slate-700"
        >
          {shareMode === 'short' ? '短縮版をコピー' : 'フル版をコピー'}
        </button>
      </div>
    </section>
  );
}
