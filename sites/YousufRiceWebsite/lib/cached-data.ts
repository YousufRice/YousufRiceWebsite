"use cache";

import {
  databases,
  storage,
  DATABASE_ID,
  PRODUCTS_TABLE_ID,
  PRODUCT_IMAGES_TABLE_ID,
  STORAGE_BUCKET_ID,
} from "@/lib/appwrite";
import { Product, ProductImage } from "@/lib/types";
import { Query } from "appwrite";
import { cacheTag } from "next/cache";

/**
 * Cached function to fetch all available products
 * Uses Next.js 16 'use cache' directive with PPR for optimal performance
 */
export async function getCachedProducts() {
  "use cache";
  cacheTag("products");

  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      PRODUCTS_TABLE_ID
    );
    return response.documents as unknown as Product[];
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

/**
 * Cached function to fetch regular products (excluding hotel/restaurant products)
 * Uses Next.js 16 'use cache' directive with PPR for optimal performance
 */
export async function getCachedRegularProducts() {
  "use cache";
  cacheTag("products", "regular-products");

  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      PRODUCTS_TABLE_ID
    );

    // Filter out products that contain "hotel" or "restaurant" in their name or description
    const allProducts = response.documents as unknown as Product[];
    return allProducts.filter((product) => {
      const searchText = `${product.name} ${
        product.description || ""
      }`.toLowerCase();
      return (
        !searchText.includes("hotel") && !searchText.includes("restaurant")
      );
    });
  } catch (error) {
    console.error("Error fetching regular products:", error);
    return [];
  }
}

/**
 * Cached function to fetch product images
 * Uses Next.js 16 'use cache' directive with PPR for optimal performance
 */
export async function getCachedProductImages(productIds: string[]) {
  "use cache";
  cacheTag("product-images");

  if (productIds.length === 0) return [];

  try {
    // Fetch all primary images
    const response = await databases.listDocuments(
      DATABASE_ID,
      PRODUCT_IMAGES_TABLE_ID,
      [Query.equal("is_primary", true), Query.limit(100)]
    );

    // Filter to only include images for our products
    const allImages = response.documents as unknown as ProductImage[];
    return allImages.filter((img) => productIds.includes(img.product_id));
  } catch (error) {
    console.error("Error fetching product images:", error);
    return [];
  }
}

/**
 * Cached function to fetch a single product by ID
 * Uses Next.js 16 'use cache' directive with PPR for optimal performance
 */
export async function getCachedProduct(id: string) {
  "use cache";
  cacheTag("products", `product-${id}`);

  try {
    const product = await databases.getDocument(
      DATABASE_ID,
      PRODUCTS_TABLE_ID,
      id
    );
    return product as unknown as Product;
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

/**
 * Cached function to fetch all images for a specific product
 * Uses Next.js 16 'use cache' directive with PPR for optimal performance
 */
export async function getCachedProductImagesById(productId: string) {
  "use cache";
  cacheTag("product-images", `product-${productId}-images`);

  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      PRODUCT_IMAGES_TABLE_ID,
      [Query.equal("product_id", productId), Query.orderDesc("$createdAt")]
    );
    return response.documents as unknown as ProductImage[];
  } catch (error) {
    console.error("Error fetching product images:", error);
    return [];
  }
}

/**
 * Cached function to fetch products for hotels and restaurants
 * Uses Next.js 16 'use cache' directive with PPR for optimal performance
 * Filters products by name pattern containing "hotel" or "restaurant"
 */
export async function getCachedHotelRestaurantProducts() {
  "use cache";
  cacheTag("products", "hotel-restaurant-products");

  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      PRODUCTS_TABLE_ID,
      [Query.equal("available", true), Query.orderDesc("$createdAt")]
    );

    // Filter products that contain "hotel" or "restaurant" in their name or description
    const allProducts = response.documents as unknown as Product[];
    return allProducts.filter((product) => {
      const searchText = `${product.name} ${
        product.description || ""
      }`.toLowerCase();
      return searchText.includes("hotel") || searchText.includes("restaurant");
    });
  } catch (error) {
    console.error("Error fetching hotel/restaurant products:", error);
    return [];
  }
}

// Note: Image URL generation should be done inline in components
// as it's a synchronous operation that doesn't benefit from caching
