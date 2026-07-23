import { X, FileText, Trash2, ArrowRight } from 'lucide-react';
import type { DraftOrder } from '@xyntra/types';

interface DraftOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  drafts: DraftOrder[];
  onLoadDraft: (draft: DraftOrder) => void;
  onDeleteDraft: (draftId: string) => void;
  currency: string;
}

export function DraftOrdersModal({
  isOpen,
  onClose,
  drafts,
  onLoadDraft,
  onDeleteDraft,
  currency,
}: DraftOrdersModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                Saved Carts & Draft Orders
              </h3>
              <p className="text-xs text-slate-500">Restore or manage saved POS checkouts</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drafts List */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-3">
          {drafts.length > 0 ? (
            drafts.map((draft) => {
              const itemCount = draft.items.reduce((acc, i) => acc + i.quantity, 0);
              return (
                <div
                  key={draft.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex items-center justify-between gap-4 hover:border-blue-500/50 transition-colors"
                >
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                      {draft.title}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {itemCount} item{itemCount !== 1 ? 's' : ''} • Total:{' '}
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {currency === 'NGN' ? '₦' : currency} {draft.total.toLocaleString()}
                      </span>
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Saved {new Date(draft.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onDeleteDraft(draft.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      title="Delete Draft"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onLoadDraft(draft)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
                    >
                      <span>Load Cart</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-sm text-slate-400">
              No saved draft carts found. Save a cart from POS anytime!
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-400 flex justify-between items-center">
          <span>{drafts.length} Active Drafts</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
