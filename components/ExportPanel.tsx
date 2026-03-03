type ExportPanelProps = {
  onExport: () => void;
  isExporting: boolean;
  exportError: string | null;
  onCopyShareText: () => void;
  shareText: string;
};

export function ExportPanel({
  onExport,
  isExporting,
  exportError,
  onCopyShareText,
  shareText
}: ExportPanelProps) {
  return (
    <section className="space-y-3 rounded-lg border border-slate-700 bg-slate-900/60 p-4">
      <button
        type="button"
        onClick={onExport}
        disabled={isExporting}
        className="w-full rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isExporting ? '画像生成中...' : 'PNGをダウンロード'}
      </button>

      {exportError && <p className="text-xs text-rose-300">{exportError}</p>}

      <div className="rounded-md border border-slate-700 p-3">
        <p className="mb-2 text-xs text-slate-300">X向けシェア文（任意）</p>
        <p className="mb-3 whitespace-pre-wrap text-xs text-slate-100">{shareText}</p>
        <button
          type="button"
          onClick={onCopyShareText}
          className="rounded border border-slate-600 px-3 py-1 text-xs text-slate-100 hover:bg-slate-700"
        >
          シェア文をコピー
        </button>
      </div>
    </section>
  );
}
