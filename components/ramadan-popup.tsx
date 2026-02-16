"use client"

import * as React from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { X } from "lucide-react"

export function RamadanPopup() {
    const [open, setOpen] = React.useState(false)

    React.useEffect(() => {
        // Check if popup should be shown
        const hasSeenPopup = localStorage.getItem('ramadan-popup-seen')
        const lastShown = localStorage.getItem('ramadan-popup-last-shown')
        const now = Date.now()

        // Show popup if:
        // 1. Never seen before, OR
        // 2. Last shown more than 24 hours ago
        if (!hasSeenPopup || (lastShown && now - parseInt(lastShown) > 24 * 60 * 60 * 1000)) {
            // Delay popup slightly for better UX
            const timer = setTimeout(() => {
                setOpen(true)
                localStorage.setItem('ramadan-popup-seen', 'true')
                localStorage.setItem('ramadan-popup-last-shown', now.toString())
            }, 1500)

            return () => clearTimeout(timer)
        }
    }, [])

    const handleClose = () => {
        setOpen(false)
    }

    if (process.env.NEXT_PUBLIC_ENABLE_RAMADAN_OFFER !== 'true') {
        return null
    }

    return (
        <>
            <style jsx global>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes fadeInScale {
                    from {
                        opacity: 0;
                        transform: scale(0.5);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                @keyframes slideInFromLeft {
                    from {
                        opacity: 0;
                        transform: translateX(-30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                @keyframes glow {
                    0%, 100% {
                        filter: drop-shadow(0 0 10px rgba(250, 204, 21, 0.5));
                    }
                    50% {
                        filter: drop-shadow(0 0 20px rgba(250, 204, 21, 0.8));
                    }
                }

                .animate-fadeInUp {
                    animation: fadeInUp 0.8s ease-out forwards;
                }

                .animate-fadeInScale {
                    animation: fadeInScale 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                }

                .animate-slideInFromLeft {
                    animation: slideInFromLeft 0.7s ease-out forwards;
                }

                .animate-glow {
                    animation: glow 2s ease-in-out infinite;
                }
            `}</style>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-md p-0 overflow-hidden border-0 bg-linear-to-br from-emerald-900 via-emerald-800 to-teal-900 sm:rounded-2xl w-[calc(100%-2rem)] sm:w-full max-h-[90vh] overflow-y-auto">
                    {/* Close button */}
                    <button
                        onClick={handleClose}
                        className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2.5 backdrop-blur-sm transition-all hover:bg-white hover:scale-110 shadow-lg"
                        aria-label="Close"
                    >
                        <X className="h-5 w-5 text-emerald-900" />
                    </button>

                    {/* Content */}
                    <div className="relative">
                        {/* Decorative elements */}
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9Ii4wNSIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9nPjwvc3ZnPg==')] opacity-30"></div>

                        {/* Header with moon icon */}
                        <div className="relative px-8 pt-10 pb-6 text-center">
                            <div className="mb-4 flex justify-center">
                                <div className="relative animate-fadeInScale" style={{ animationDelay: '0.2s', opacity: 0, animationFillMode: 'forwards' }}>
                                    <div className="absolute inset-0 animate-ping rounded-full bg-yellow-400/30"></div>
                                    <div className="relative text-7xl animate-glow">🌙</div>
                                </div>
                            </div>

                            <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-lg animate-fadeInUp" style={{ animationDelay: '0.5s', opacity: 0, animationFillMode: 'forwards' }}>
                                Ramadan Mubarak!
                            </h2>

                            <div className="inline-block px-4 py-1 bg-yellow-400 text-emerald-900 font-bold rounded-full text-sm mb-4 shadow-lg animate-fadeInScale" style={{ animationDelay: '0.7s', opacity: 0, animationFillMode: 'forwards' }}>
                                Special Offer
                            </div>
                        </div>

                        {/* Offer details */}
                        <div className="relative px-8 pb-8">
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-2xl animate-fadeInUp" style={{ animationDelay: '0.9s', opacity: 0, animationFillMode: 'forwards' }}>
                                <div className="text-center mb-6">
                                    <div className="text-5xl font-extrabold text-yellow-400 mb-2 drop-shadow-lg">
                                        1kg FREE
                                    </div>
                                    <div className="text-xl text-white/90 font-medium">
                                        Premium Rice
                                    </div>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center gap-3 text-white/90 animate-slideInFromLeft" style={{ animationDelay: '1.1s', opacity: 0, animationFillMode: 'forwards' }}>
                                        <div className="shrink-0 w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center">
                                            <span className="text-emerald-900 text-sm font-bold">✓</span>
                                        </div>
                                        <span className="text-sm">On every 15kg rice order</span>
                                    </div>

                                    <div className="flex items-center gap-3 text-white/90 animate-slideInFromLeft" style={{ animationDelay: '1.3s', opacity: 0, animationFillMode: 'forwards' }}>
                                        <div className="shrink-0 w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center">
                                            <span className="text-emerald-900 text-sm font-bold">✓</span>
                                        </div>
                                        <span className="text-sm">Free delivery on all orders</span>
                                    </div>

                                    <div className="flex items-center gap-3 text-white/90 animate-slideInFromLeft" style={{ animationDelay: '1.5s', opacity: 0, animationFillMode: 'forwards' }}>
                                        <div className="shrink-0 w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center">
                                            <span className="text-emerald-900 text-sm font-bold">✓</span>
                                        </div>
                                        <span className="text-sm">Up to 12% - 24% discount</span>
                                    </div>
                                </div>

                                {/* CTA Button */}
                                <a
                                    href="#products"
                                    onClick={handleClose}
                                    className="block w-full bg-linear-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-emerald-900 font-bold py-4 px-6 rounded-xl text-center transition-all transform hover:scale-105 shadow-lg hover:shadow-xl animate-fadeInScale"
                                    style={{ animationDelay: '1.7s', opacity: 0, animationFillMode: 'forwards' }}
                                >
                                    Shop Now
                                </a>
                            </div>

                            {/* Footer text */}
                            <p className="text-center text-white/60 text-xs mt-4 animate-fadeInUp" style={{ animationDelay: '1.9s', opacity: 0, animationFillMode: 'forwards' }}>
                                Ramazan Mubarak
                            </p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}