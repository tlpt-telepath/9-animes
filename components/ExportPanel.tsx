type ExportPanelProps = {
  onCopyShareText: () => void;
  shareText: string;
  copyError: string | null;
};

export function ExportPanel({
  onCopyShareText,
  shareText,
  copyError
}: ExportPanelProps) {
  return (
    <section className="space-y-3 rounded-lg border border-slate-700 bg-slate-900/60 p-4">
      {copyError && <p className="text-xs text-rose-300">{copyError}</p>}

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
