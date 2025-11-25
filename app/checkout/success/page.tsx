"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ShoppingBag, ArrowRight } from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";

export default function OrderSuccessPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderId = searchParams.get("orderId");
    const [countdown, setCountdown] = useState(10);

    useEffect(() => {
        // Trigger confetti on load
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => {
            return Math.random() * (max - min) + min;
        };

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
            });
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
            });
        }, 250);

        return () => clearInterval(interval);
    }, []);

    if (!orderId) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md text-center p-6">
                    <CardContent>
                        <p className="text-red-500">Order ID not found.</p>
                        <Link href="/">
                            <Button className="mt-4">Return Home</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-linear-to-b from-gray-50 to-white flex items-center justify-center p-4">
            <Card className="w-full max-w-lg border-2 border-green-100 shadow-2xl rounded-2xl overflow-hidden">
                <CardHeader className="bg-green-50 p-8 text-center border-b border-green-100">
                    <div className="mx-auto bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <CardTitle className="text-3xl font-bold text-green-800 mb-2">
                        Order Placed!
                    </CardTitle>
                    <p className="text-green-700">
                        Thank you for your purchase. Your order has been received.
                    </p>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-center">
                        <p className="text-sm text-gray-500 mb-1">Order Reference</p>
                        <code className="text-lg font-mono font-bold text-[#27247b]">
                            {orderId}
                        </code>
                    </div>

                    <div className="space-y-3">
                        <Link href={`/orders/${orderId}`} className="block">
                            <Button
                                className="w-full bg-[#27247b] hover:bg-[#27247b]/90 text-white font-bold py-6 text-lg rounded-xl shadow-lg transition-all hover:scale-[1.02]"
                            >
                                View Order Details
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </Link>

                        <Link href="/products" className="block">
                            <Button
                                variant="outline"
                                className="w-full border-2 border-[#27247b]/20 text-[#27247b] font-bold py-6 text-lg rounded-xl hover:bg-[#27247b]/5 transition-all"
                            >
                                <ShoppingBag className="mr-2 w-5 h-5" />
                                Continue Shopping
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
