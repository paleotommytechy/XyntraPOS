import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface RealtimeSubscriptionOptions {
  table: string;
  businessId?: string;
  onPayload?: (payload: any) => void;
  toastMessage?: string;
  enabled?: boolean;
}

export function useRealtimeSubscription({
  table,
  businessId,
  onPayload,
  toastMessage,
  enabled = true,
}: RealtimeSubscriptionOptions) {
  useEffect(() => {
    if (!enabled) return;

    const channelName = `realtime-${table}-${Date.now()}`;
    const channel = supabase.channel(channelName);

    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: businessId ? `business_id=eq.${businessId}` : undefined,
        },
        (payload) => {
          if (toastMessage) {
            toast.info(toastMessage, { duration: 4000 });
          }
          if (onPayload) {
            onPayload(payload);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to Supabase Realtime table: ${table}`);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, businessId, onPayload, toastMessage, enabled]);
}
