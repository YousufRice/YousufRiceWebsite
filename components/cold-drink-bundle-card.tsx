"use client";

import Image from "next/image";
import Link from "next/link";
import { Product } from "@/lib/types";
import { Card, CardContent } from "./ui/card";
import { STORAGE_BUCKET_ID } from "@/lib/appwrite";
import { formatCurrency, getPricePerKg } from "@/lib/utils";
import { Info } from "lucide-react";

interface ColdDrinkBundleCardProps {
    product: Product;
    imageFileId?: string;
}

export function ColdDrinkBundleCard({ product, imageFileId }: ColdDrinkBundleCardProps) {
    const imageUrl = imageFileId
        ? `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${STORAGE_BUCKET_ID}/files/${imageFileId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`
        : null;

    return (
        <Link href={`/products/${product.$id}?bundle=colddrink`}>
            <Card className="overflow-hidden hover:shadow-[0_10px_40px_-5px_rgba(39,36,123,0.4)] transition-all duration-500 border-2 border-[#27247b]/10 hover:border-[#27247b]/50 bg-white group h-full cursor-pointer relative shadow-xl transform hover:-translate-y-2">
                {/* Cold Drink Ribbon/Badge */}
                <div className="absolute top-0 right-0 z-20 overflow-hidden w-37.5 h-37.5">
                    <div className="absolute transform rotate-45 bg-linear-to-r from-[#27247b] to-blue-600 text-white font-black text-center py-2 -right-8.75 top-8 w-42.5 shadow-[0_4px_15px_rgba(0,0,0,0.2)] border-b-2 border-cyan-400 tracking-widest text-sm flex items-center justify-center gap-1.5 animate-[pulse_3s_ease-in-out_infinite]">
                        <span className="group-hover:animate-bounce inline-block origin-bottom transition-transform group-hover:scale-125">🥤</span> FREE DRINK
                    </div>
                </div>

                <div className="flex flex-col h-full bg-linear-to-br from-white to-blue-50/50 relative">

                    {/* Subtle Generic Cold Drink background pattern or color hint */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-blue-100/80 via-transparent to-transparent pointer-events-none group-hover:from-cyan-100/60 transition-colors duration-700"></div>

                    {/* Image Section */}
                    <div className="relative w-full h-56 md:h-64 transition-all duration-500 overflow-hidden flex items-center justify-center p-4 bg-linear-to-b from-transparent to-blue-50/30">
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
                        <div className="absolute bottom-3 left-3 z-20 bg-linear-to-r from-[#27247b] to-blue-800 text-white px-3.5 py-2 rounded-xl shadow-[0_8px_25px_rgba(39,36,123,0.4)] border border-cyan-400/50 flex items-center gap-2 transform group-hover:scale-105 group-hover:-translate-y-1 transition-all duration-400">
                            <span className="text-xl animate-pulse delay-75">🎁</span>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-widest leading-none mb-1">Special Deal</span>
                                <span className="text-sm font-black leading-none drop-shadow-sm">1 Free Cold Drink (1L)</span>
                            </div>
                        </div>
                    </div>

                    {/* Content Section */}
                    <CardContent className="p-5 flex flex-col flex-1 relative z-10 border-t border-gray-100/50 pt-6">
                        {/* Tagline */}
                        <div className="mb-2 inline-flex">
                            <span className="bg-linear-to-r from-blue-100 to-blue-50 text-[#27247b] text-[10px] font-black px-2.5 py-1 rounded shadow-sm uppercase tracking-widest border border-blue-200/60">
                                10kg Exclusive
                            </span>
                        </div>

                        {/* Product Name */}
                        <h3 className="text-lg md:text-xl font-black text-[#27247b] mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-linear-to-r group-hover:from-[#27247b] group-hover:to-blue-600 transition-all duration-300 line-clamp-2 leading-tight">
                            {product.name} + Free Cold Drink
                        </h3>

                        {/* Deal Explanation */}
                        <div className="bg-linear-to-br from-blue-50/80 to-blue-100/40 rounded-xl p-3 mb-5 mt-auto border border-blue-200/60 shadow-inner group-hover:shadow-[inset_0_2px_10px_rgba(59,130,246,0.1)] group-hover:border-blue-300/80 transition-all duration-500">
                            <div className="flex items-start gap-3">
                                <div className="bg-linear-to-br from-[#27247b] to-blue-600 rounded-full p-1.5 mt-0.5 shadow-md group-hover:shadow-lg transition-shadow">
                                  <Info className="w-3.5 h-3.5 text-white shrink-0" />
                                </div>
                                <p className="text-sm text-[#27247b] font-medium leading-snug">
                                    Buy a 10kg bag and get a <strong className="text-blue-700 font-extrabold bg-blue-100/80 px-1 py-0.5 rounded ml-0.5">1 Litre Cold Drink FREE</strong>.
                                    Buy two, get two!
                                </p>
                            </div>
                        </div>

                        {/* Price & Action */}
                        <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                            <div>
                                <p className="text-[11px] text-[#27247b]/70 font-bold uppercase tracking-widest mb-0.5">Price / 10kg</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-black text-[#27247b] tracking-tight">
                                        {formatCurrency(getPricePerKg(product, 10) * 10)}
                                    </span>
                                </div>
                            </div>
                            <div className="bg-linear-to-r from-[#27247b] to-blue-700 text-white px-5 py-2.5 rounded-full font-bold text-sm shadow-[0_4px_15px_rgba(39,36,123,0.3)] group-hover:shadow-[0_6px_25px_rgba(39,36,123,0.5)] group-hover:from-blue-700 group-hover:to-[#27247b] transition-all duration-500 flex items-center gap-1.5 group-hover:scale-105 active:scale-95">
                                View Deal
                                <svg className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
