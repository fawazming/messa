import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { listCampaigns } from '@/db/database';
import type { Campaign } from '@/types';

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setCampaigns(await listCampaigns());
    } catch {
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  return { campaigns, loading, reload };
}
