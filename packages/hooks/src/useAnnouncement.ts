import { useEffect, useState } from 'react';
import { createClient, createServices, Query } from '@yousuf-rice/api-client';
import type { Announcement } from '@yousuf-rice/types';

interface AnnouncementConfig {
  endpoint: string;
  projectId: string;
  databaseId: string;
  collectionId: string;
}

export function useAnnouncement(config: AnnouncementConfig) {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);

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
          setAnnouncement(res.documents[0] as Announcement);
        }
      } catch (err) {
        console.error('Failed to fetch announcement:', err);
      }
    }

    fetch();

    const unsub = client.subscribe(
      `databases.${config.databaseId}.collections.${config.collectionId}.documents`,
      () => fetch()
    );

    return () => unsub();
  }, [config.endpoint, config.projectId, config.databaseId, config.collectionId]);

  return announcement;
}
