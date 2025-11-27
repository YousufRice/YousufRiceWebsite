import { Suspense } from "react";
import CheckoutFailureContent from "./failure-content";

export default function CheckoutFailurePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-pulse text-gray-600">Loading...</div>
            </div>
        }>
            <CheckoutFailureContent />
        </Suspense>
    );
}
