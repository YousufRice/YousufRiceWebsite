import { useEffect, useState } from 'react';
import { createClient, createServices, ID, Query } from '@yousuf-rice/api-client';
import { COLLECTIONS } from '@yousuf-rice/config';
import type { Product, ProductImage } from '@yousuf-rice/types';

interface ProductsConfig {
  endpoint: string;
  projectId: string;
  databaseId: string;
}

export function useProducts(config: ProductsConfig) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const client = createClient(config);
    const { tablesDB } = createServices(client);

    async function fetchProducts() {
      try {
        const res = await tablesDB.listDocuments(
          config.databaseId,
          COLLECTIONS.PRODUCTS,
          [Query.equal('available', true)]
        );
        setProducts(res.documents as Product[]);
      } catch (err) {
        console.error('Failed to fetch products:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();

    // Appwrite Realtime subscription
    const unsub = client.subscribe(
      `databases.${config.databaseId}.collections.${COLLECTIONS.PRODUCTS}.documents`,
      () => fetchProducts()
    );

    return () => unsub();
  }, [config.endpoint, config.projectId, config.databaseId]);

  return { products, loading };
}
