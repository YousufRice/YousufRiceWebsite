import { useEffect, useState } from 'react';
import { createClient, createServices, Query } from '@yousuf-rice/api-client';
import type { PopupConfig } from '@yousuf-rice/types';

interface PopupHookConfig {
  endpoint: string;
  projectId: string;
  databaseId: string;
  collectionId: string;
}

export function usePopup(config: PopupHookConfig) {
  const [popup, setPopup] = useState<PopupConfig | null>(null);

  useEffect(() => {
    const client = createClient(config);
    const { tablesDB } = createServices(client);

    async function fetch() {
      try {
        const res = await tablesDB.listDocuments(config.databaseId, config.collectionId, [
          Query.equal('is_active', true),
          Query.limit(1),
        ]);
        if (res.documents.length > 0) {
          setPopup(res.documents[0] as PopupConfig);
        }
      } catch (err) {
        console.error('Failed to fetch popup:', err);
      }
    }

    fetch();

    const unsub = client.subscribe(
      `databases.${config.databaseId}.collections.${config.collectionId}.documents`,
      () => fetch()
    );

    return () => unsub();
  }, [config.endpoint, config.projectId, config.databaseId, config.collectionId]);

  return popup;
}
