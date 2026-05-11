import { useEffect, useState } from 'react';
import { createClient, createServices } from '@yousuf-rice/api-client';
import { BUCKETS } from '@yousuf-rice/config';
import type { BannerImage } from '@yousuf-rice/types';

interface BannerConfig {
  endpoint: string;
  projectId: string;
  databaseId: string;
}

export function useBannerImages(config: BannerConfig) {
  const [images, setImages] = useState<BannerImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const client = createClient(config);
    const { storage } = createServices(client);

    async function fetchBanners() {
      try {
        const res = await storage.listFiles(BUCKETS.BANNER_IMAGES);
        const mapped: BannerImage[] = res.files.map((file) => ({
          $id: file.$id,
          file_id: file.$id,
          url: `${config.endpoint}/storage/buckets/${BUCKETS.BANNER_IMAGES}/files/${file.$id}/view?project=${config.projectId}`,
          alt: file.name,
          is_active: true,
          $createdAt: file.$createdAt,
        }));
        setImages(mapped);
      } catch (err) {
        console.error('Failed to fetch banners:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchBanners();

    const unsub = client.subscribe(
      `buckets.${BUCKETS.BANNER_IMAGES}.files`,
      () => fetchBanners()
    );

    return () => unsub();
  }, [config.endpoint, config.projectId, config.databaseId]);

  return { images, loading };
}
