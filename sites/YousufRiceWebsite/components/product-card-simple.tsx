"use client";

import Image from "next/image";
import Link from "next/link";
import { Product } from "@/lib/types";
import { Card, CardContent } from "./ui/card";
import { storage, STORAGE_BUCKET_ID } from "@/lib/appwrite";

interface ProductCardSimpleProps {
  product: Product;
  imageFileId?: string;
}

export function ProductCardSimple({
  product,
  imageFileId,
}: ProductCardSimpleProps) {
  const imageUrl = imageFileId
    ? `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${STORAGE_BUCKET_ID}/files/${imageFileId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`
    : null;

  return (
    <Link href={`/products/${product.$id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-[#ffff03] bg-white group h-full cursor-pointer">
        <div className="flex flex-col h-full">
          {/* Image Section */}
          <div className="relative w-full h-48 md:h-56 bg-linear-to-br from-[#27247b]/5 to-[#ffff03]/10 group-hover:from-[#27247b]/20 group-hover:to-[#ffff03]/30 transition-all duration-500 overflow-hidden">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={product.name}
                fill
                className="object-contain p-3 group-hover:scale-110 transition-transform duration-700 ease-out"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-5xl mb-2 animate-pulse">🌾</div>
                  <p className="text-xs text-gray-600 font-medium">No Image</p>
                </div>
              </div>
            )}
            {!product.available && (
              <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center backdrop-blur-sm">
                <span className="text-white font-bold text-sm bg-red-600 px-4 py-2 rounded-full">
                  Out of Stock
                </span>
              </div>
            )}
          </div>

          {/* Content Section */}
          <CardContent className="p-4 flex flex-col flex-1">
            {/* Product Name */}
            <h3 className="text-base md:text-lg font-bold text-[#27247b] mb-2 group-hover:text-[#27247b]/80 transition-colors line-clamp-2">
              {product.name}
            </h3>

            {/* Product Description */}
            {product.description && (
              <p className="text-xs md:text-sm text-gray-600 leading-relaxed line-clamp-3 flex-1">
                {product.description}
              </p>
            )}

            {/* View Details Link */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs font-semibold text-[#27247b] group-hover:text-[#ffff03] transition-colors flex items-center gap-1">
                View Details
                <svg
                  className="w-3 h-3 transform group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </p>
            </div>
          </CardContent>
        </div>
      </Card>
    </Link>
  );
}
