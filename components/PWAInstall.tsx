"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

export function PWAInstall() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if device is iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((registration) => {
          console.log("Service Worker registered:", registration);
        })
        .catch((error) => {
          console.log("Service Worker registration failed:", error);
        });
    }

    // Handle beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      setDeferredPrompt(null);
      setIsInstallable(false);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  // Show iOS installation instructions
  if (isIOS && showPrompt) {
    return (
      <div className="fixed bottom-24 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm z-50 border border-[#27247b]/20">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-[#27247b]">Install App</h3>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-3">
          Tap the share button and select "Add to Home Screen" to install Yousuf
          Rice app.
        </p>
        <div className="w-full h-2 bg-linear-to-r from-[#27247b] to-[#ffff0b] rounded-full mb-3"></div>
      </div>
    );
  }

  // Show install prompt for other browsers
  if (isInstallable && showPrompt && !isIOS) {
    return (
      <div className="fixed bottom-24 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm z-50 border border-[#27247b]/20">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold text-[#27247b]">Install Yousuf Rice</h3>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Install our app for quick access and offline support.
        </p>
        <button
          onClick={handleInstall}
          className="w-full bg-linear-to-r from-[#27247b] to-[#ffff0b] text-white font-medium py-2.5 px-4 rounded-lg transition-all hover:opacity-90 shadow-md hover:shadow-lg"
        >
          Install Now
        </button>
      </div>
    );
  }

  return null;
}
