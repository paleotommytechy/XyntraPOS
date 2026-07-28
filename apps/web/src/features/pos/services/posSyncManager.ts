import { posApi } from './pos.api';
import type { CheckoutInput, CheckoutCartItem } from './pos.api';
import { toast } from 'sonner';

export interface QueuedOfflineTransaction {
  id: string;
  timestamp: string;
  input: CheckoutInput;
  items: CheckoutCartItem[];
}

const STORAGE_KEY = 'xyntra_pos_offline_queue';

export const posSyncManager = {
  getQueue(): QueuedOfflineTransaction[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveQueue(queue: QueuedOfflineTransaction[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.warn('Failed to persist offline POS queue:', e);
    }
  },

  enqueue(input: CheckoutInput, items: CheckoutCartItem[]): QueuedOfflineTransaction {
    const queue = this.getQueue();
    const offlineId = `OFFLINE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const entry: QueuedOfflineTransaction = {
      id: offlineId,
      timestamp: new Date().toISOString(),
      input: {
        ...input,
        payment_reference: input.payment_reference || `REF-${offlineId}`,
      },
      items,
    };

    queue.push(entry);
    this.saveQueue(queue);
    return entry;
  },

  async syncQueue(): Promise<{ syncedCount: number; remainingCount: number }> {
    const queue = this.getQueue();
    if (queue.length === 0) return { syncedCount: 0, remainingCount: 0 };

    let syncedCount = 0;
    const remaining: QueuedOfflineTransaction[] = [];

    for (const item of queue) {
      try {
        await posApi.checkout(item.input, item.items);
        syncedCount++;
      } catch (err) {
        console.warn(`Failed to sync queued offline transaction (${item.id}):`, err);
        remaining.push(item);
      }
    }

    this.saveQueue(remaining);

    if (syncedCount > 0) {
      toast.success(
        `Offline Sync Complete: ${syncedCount} queued POS sale(s) synced to database.`,
        { duration: 5000 }
      );
    }

    return { syncedCount, remainingCount: remaining.length };
  },

  initAutoSync() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      console.log('Network connectivity restored. Syncing offline POS transactions...');
      this.syncQueue();
    });
  },
};
