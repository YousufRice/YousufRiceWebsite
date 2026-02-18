"use client"

import * as React from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { X } from "lucide-react"

export function RamadanPopup() {
    const [open, setOpen] = React.useState(false)

    React.useEffect(() => {
        const hasSeenPopup = localStorage.getItem('ramadan-popup-seen')
        const lastShown = localStorage.getItem('ramadan-popup-last-shown')
        const now = Date.now()

        if (!hasSeenPopup || (lastShown && now - parseInt(lastShown) > 24 * 60 * 60 * 1000)) {
            const timer = setTimeout(() => {
                setOpen(true)
                localStorage.setItem('ramadan-popup-seen', 'true')
                localStorage.setItem('ramadan-popup-last-shown', now.toString())
            }, 1500)
            return () => clearTimeout(timer)
        }
    }, [])

    const handleClose = () => setOpen(false)

    if (process.env.NEXT_PUBLIC_ENABLE_RAMADAN_OFFER !== 'true') return null

    return (
        <>
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Poppins:wght@500;600;700&display=swap');

                @keyframes starFloat {
                    0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.7; }
                    50% { transform: translateY(-12px) rotate(180deg); opacity: 1; }
                }
                @keyframes moonGlow {
                    0%, 100% { text-shadow: 0 0 20px #fbbf24, 0 0 40px #f59e0b, 0 0 80px #d97706; transform: scale(1); }
                    50% { text-shadow: 0 0 40px #fbbf24, 0 0 80px #f59e0b, 0 0 120px #d97706; transform: scale(1.08); }
                }
                @keyframes shimmer {
                    0% { background-position: -200% center; }
                    100% { background-position: 200% center; }
                }
                @keyframes popIn {
                    0% { opacity: 0; transform: scale(0.6) translateY(30px); }
                    70% { transform: scale(1.05) translateY(-5px); }
                    100% { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(24px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes pulseRing {
                    0% { transform: scale(0.8); opacity: 0.8; }
                    100% { transform: scale(2); opacity: 0; }
                }
                @keyframes badgePop {
                    0% { opacity: 0; transform: scale(0) rotate(-12deg); }
                    80% { transform: scale(1.1) rotate(3deg); }
                    100% { opacity: 1; transform: scale(1) rotate(0deg); }
                }
                @keyframes ctaShine {
                    0% { left: -100%; }
                    100% { left: 200%; }
                }

                .ramadan-modal-content {
                    font-family: 'Poppins', sans-serif;
                    animation: popIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                    background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 40%, #064e3b 100%) !important;
                    border: 2px solid rgba(251, 191, 36, 0.4) !important;
                    box-shadow: 0 0 60px rgba(251, 191, 36, 0.2), 0 30px 80px rgba(0,0,0,0.6) !important;
                }

                .moon-icon {
                    animation: moonGlow 2.5s ease-in-out infinite;
                    display: inline-block;
                }

                .star-1 { animation: starFloat 3s ease-in-out infinite; }
                .star-2 { animation: starFloat 3.5s ease-in-out infinite 0.5s; }
                .star-3 { animation: starFloat 2.8s ease-in-out infinite 1s; }
                .star-4 { animation: starFloat 4s ease-in-out infinite 1.5s; }

                .title-text {
                    font-family: 'Playfair Display', serif;
                    background: linear-gradient(135deg, #fbbf24 0%, #fef3c7 50%, #f59e0b 100%);
                    background-size: 200% auto;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    animation: shimmer 3s linear infinite;
                }

                .free-badge {
                    animation: badgePop 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s both;
                }

                .offer-card {
                    animation: slideUp 0.7s ease-out 0.5s both;
                    background: rgba(255,255,255,0.06);
                    border: 1px solid rgba(251, 191, 36, 0.25);
                    backdrop-filter: blur(12px);
                }

                .point-row {
                    background: rgba(251, 191, 36, 0.08);
                    border: 1px solid rgba(251, 191, 36, 0.2);
                    border-radius: 14px;
                    transition: background 0.2s, transform 0.2s;
                }
                .point-row:hover {
                    background: rgba(251, 191, 36, 0.15);
                    transform: translateX(4px);
                }

                .cta-btn {
                    position: relative;
                    overflow: hidden;
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%);
                    box-shadow: 0 6px 30px rgba(245, 158, 11, 0.5);
                    transition: transform 0.2s, box-shadow 0.2s;
                    animation: slideUp 0.7s ease-out 1s both;
                }
                .cta-btn:hover {
                    transform: translateY(-3px) scale(1.02);
                    box-shadow: 0 12px 40px rgba(245, 158, 11, 0.7);
                }
                .cta-btn::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 60%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent);
                    animation: ctaShine 2.5s ease-in-out infinite 2s;
                }

                .pulse-ring {
                    position: absolute;
                    border-radius: 50%;
                    border: 2px solid rgba(251, 191, 36, 0.6);
                    animation: pulseRing 2s ease-out infinite;
                }

                .point-1 { animation: slideUp 0.6s ease-out 0.6s both; }
                .point-2 { animation: slideUp 0.6s ease-out 0.75s both; }
                .point-3 { animation: slideUp 0.6s ease-out 0.9s both; }
            `}</style>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="ramadan-modal-content max-w-105 p-0 overflow-hidden border-0 sm:rounded-3xl w-[calc(100%-1.5rem)] sm:w-full max-h-[95vh] overflow-y-auto">
                    {/* Stars decoration */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <span className="star-1 absolute top-8 left-6 text-yellow-300 text-xl">✦</span>
                        <span className="star-2 absolute top-16 right-10 text-yellow-200 text-sm">★</span>
                        <span className="star-3 absolute bottom-24 left-8 text-yellow-300 text-base">✦</span>
                        <span className="star-4 absolute top-20 left-1/2 text-yellow-200 text-xs">✦</span>
                        {/* Radial glow */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full" style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.12) 0%, transparent 70%)' }} />
                    </div>

                    {/* Close button */}
                    <button
                        onClick={handleClose}
                        className="absolute right-3 top-3 z-20 rounded-full bg-white/10 border border-white/20 p-2 backdrop-blur-sm transition-all hover:bg-white/20 hover:scale-110"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4 text-white" />
                    </button>

                    <div className="relative px-6 pt-8 pb-7">
                        {/* Moon + Header */}
                        <div className="text-center mb-5">
                            <div className="relative inline-flex items-center justify-center mb-3">
                                <div className="pulse-ring w-20 h-20" style={{ animationDelay: '0s' }} />
                                <div className="pulse-ring w-20 h-20" style={{ animationDelay: '1s' }} />
                                <span className="moon-icon text-6xl relative z-10">🌙</span>
                            </div>

                            <h2 className="title-text text-4xl font-black leading-tight mb-1">
                                Ramadan<br />Mubarak!
                            </h2>
                            <p className="text-yellow-300/80 text-sm font-medium tracking-widest uppercase mt-1">Exclusive Offer Inside</p>
                        </div>

                        {/* Big FREE badge */}
                        <div className="free-badge text-center mb-5">
                            <div className="inline-flex flex-col items-center gap-0.5 bg-linear-to-br from-yellow-400 to-amber-600 rounded-2xl px-8 py-3 shadow-2xl" style={{ boxShadow: '0 0 30px rgba(251,191,36,0.5)' }}>
                                <span className="text-5xl font-black text-white leading-none tracking-tight" style={{ fontFamily: 'Playfair Display, serif', textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>1kg FREE</span>
                                <span className="text-base font-semibold text-amber-900">Premium Basmati Rice</span>
                            </div>
                        </div>

                        {/* Points */}
                        <div className="offer-card rounded-2xl p-4 space-y-3 mb-5">
                            <div className="point-row point-1 flex items-center gap-4 p-3.5">
                                <div className="shrink-0 w-10 h-10 rounded-xl bg-linear-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-lg shadow-lg">
                                    🛒
                                </div>
                                <div>
                                    <p className="text-white font-bold text-base leading-tight">On every 15kg order</p>
                                    <p className="text-yellow-300 font-semibold text-sm mt-0.5" style={{ textShadow: '0 0 10px rgba(251,191,36,0.6)' }}>✨ Get 1kg extra absolutely free</p>
                                </div>
                            </div>

                            <div className="point-row point-2 flex items-center gap-4 p-3.5">
                                <div className="shrink-0 w-10 h-10 rounded-xl bg-linear-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-lg shadow-lg">
                                    🚚
                                </div>
                                <div>
                                    <p className="text-white font-bold text-base leading-tight">Free Delivery</p>
                                    <p className="text-yellow-300 font-semibold text-sm mt-0.5" style={{ textShadow: '0 0 10px rgba(251,191,36,0.6)' }}>✨ On all orders, no minimum</p>
                                </div>
                            </div>

                            <div className="point-row point-3 flex items-center gap-4 p-3.5">
                                <div className="shrink-0 w-10 h-10 rounded-xl bg-linear-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-lg shadow-lg">
                                    🏷️
                                </div>
                                <div>
                                    <p className="text-white font-bold text-base leading-tight">Up to 24% Discount</p>
                                    <p className="text-yellow-300 font-semibold text-sm mt-0.5" style={{ textShadow: '0 0 10px rgba(251,191,36,0.6)' }}>✨ Ramadan special pricing</p>
                                </div>
                            </div>
                        </div>

                        {/* CTA */}
                        <a
                            href="#products"
                            onClick={handleClose}
                            className="cta-btn block w-full text-white font-bold py-4 px-6 rounded-2xl text-center text-lg"
                            style={{ fontFamily: 'Poppins, sans-serif' }}
                        >
                            🛍️ Shop Now — Grab the Deal
                        </a>

                        <p className="text-center text-yellow-300/40 text-xs mt-4 tracking-widest uppercase">
                            رمضان مبارک ✦ Ramazan Mubarak
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}