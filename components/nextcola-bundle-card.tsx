"use client";

import Image from "next/image";
import Link from "next/link";
import { Product } from "@/lib/types";
import { Card, CardContent } from "./ui/card";
import { STORAGE_BUCKET_ID } from "@/lib/appwrite";
import { formatCurrency, getPricePerKg } from "@/lib/utils";
import { Info } from "lucide-react";

interface NextcolaBundleCardProps {
    product: Product;
    imageFileId?: string;
}

export function NextcolaBundleCard({ product, imageFileId }: NextcolaBundleCardProps) {
    const imageUrl = imageFileId
        ? `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${STORAGE_BUCKET_ID}/files/${imageFileId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`
        : null;

    return (
        <Link href={`/products/${product.$id}?bundle=nextcola`}>
            <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 border-[3px] border-[#DC2626] bg-white group h-full cursor-pointer relative shadow-lg transform hover:-translate-y-1">
                {/* Next Cola Ribbon/Badge */}
                <div className="absolute top-0 right-0 z-20 overflow-hidden w-37.5 h-37.5">
                    <div className="absolute transform rotate-45 bg-[#DC2626] text-white font-bold text-center py-1.5 -right-8.75 top-8 w-42.5 shadow-md border-b border-red-800 tracking-wide text-sm flex items-center justify-center gap-1">
                        <span>🥤</span> FREE COLA
                    </div>
                </div>

                <div className="flex flex-col h-full bg-linear-to-br from-red-50 to-white relative">

                    {/* Subtle Coca-cola-like background pattern or color hint */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,var(--tw-gradient-stops))] from-red-100/40 via-transparent to-transparent pointer-events-none"></div>

                    {/* Image Section */}
                    <div className="relative w-full h-56 md:h-64 transition-all duration-500 overflow-hidden flex items-center justify-center p-4">
                        {imageUrl ? (
                            <Image
                                src={imageUrl}
                                alt={product.name}
                                fill
                                className="object-contain p-4 group-hover:scale-105 transition-transform duration-700 ease-out z-10"
                                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-50/50 rounded-t-xl z-10">
                                <div className="text-center">
                                    <div className="text-5xl mb-2 animate-pulse">🌾</div>
                                </div>
                            </div>
                        )}
                        {!product.available && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm z-30">
                                <span className="text-white font-bold text-sm bg-red-600 px-4 py-2 rounded-full shadow-lg">
                                    Out of Stock
                                </span>
                            </div>
                        )}

                        {/* Float badge for the deal */}
                        <div className="absolute bottom-3 left-3 z-20 bg-[#27247b] text-white px-3 py-1.5 rounded-lg shadow-lg border border-[#ffff03] flex items-center gap-2 transform group-hover:scale-105 transition-transform">
                            <span className="text-lg">🎁</span>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-semibold text-[#ffff03] uppercase tracking-wider leading-none">Special Deal</span>
                                <span className="text-sm font-bold leading-none mt-0.5">1 Free Next Cola (1L)</span>
                            </div>
                        </div>
                    </div>

                    {/* Content Section */}
                    <CardContent className="p-5 flex flex-col flex-1 relative z-10 border-t border-red-100">
                        {/* Tagline */}
                        <div className="mb-2 inline-flex">
                            <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider border border-red-200">
                                10kg Exclusive
                            </span>
                        </div>

                        {/* Product Name */}
                        <h3 className="text-lg md:text-xl font-black text-[#27247b] mb-2 group-hover:text-red-600 transition-colors line-clamp-2 leading-tight">
                            {product.name} + Next Cola Bundle
                        </h3>

                        {/* Deal Explanation */}
                        <div className="bg-red-50 rounded-lg p-3 mb-4 mt-auto border border-red-100">
                            <div className="flex items-start gap-2">
                                <Info className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                <p className="text-sm text-red-900 font-medium leading-tight">
                                    Buy a 10kg bag and get <strong className="text-red-600">1 litre Next Cola FREE</strong>.
                                    Buy two 10kg bags, get two!
                                </p>
                            </div>
                        </div>

                        {/* Price & Action */}
                        <div className="mt-auto pt-4 border-t border-red-100 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-0.5">Price / 10kg</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-xl font-black text-[#27247b]">
                                        {formatCurrency(getPricePerKg(product, 10) * 10)}
                                    </span>
                                </div>
                            </div>
                            <div className="bg-[#DC2626] text-white px-4 py-2 rounded-full font-bold text-sm shadow-md group-hover:bg-red-700 transition-colors flex items-center gap-1">
                                View Deal
                                <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                    </CardContent>
                </div>
            </Card>
        </Link>
    );
}
