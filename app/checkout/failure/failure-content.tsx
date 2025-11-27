"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle, AlertTriangle } from "lucide-react";

export default function CheckoutFailureContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [errorDetails, setErrorDetails] = useState<{
        code: string;
        message: string;
    } | null>(null);

    useEffect(() => {
        // PayFast might send error details in query params
        const errCode = searchParams.get("err_code");
        const errMsg = searchParams.get("err_msg");

        if (errCode || errMsg) {
            setErrorDetails({
                code: errCode || "Unknown",
                message: errMsg || "Transaction failed",
            });
        }
    }, [searchParams]);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="max-w-md w-full shadow-xl border-2 border-red-100">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                        <XCircle className="w-10 h-10 text-red-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900">
                        Payment Failed
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-6 pt-4">
                    <div className="space-y-2">
                        <p className="text-gray-600">
                            We couldn't process your payment. Please try again or choose a
                            different payment method.
                        </p>
                        {errorDetails && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-left mt-4">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="font-semibold text-red-800">Error Details:</p>
                                        <p className="text-red-700">
                                            Code: {errorDetails.code}
                                        </p>
                                        <p className="text-red-700">
                                            Message: {errorDetails.message}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button
                            onClick={() => router.push("/checkout")}
                            className="w-full bg-[#27247b] hover:bg-[#27247b]/90 text-white font-bold py-6 rounded-xl"
                        >
                            Try Again
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => router.push("/cart")}
                            className="w-full border-2 border-gray-200 hover:bg-gray-50 font-bold py-6 rounded-xl text-gray-700"
                        >
                            Return to Cart
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
