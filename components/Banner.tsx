'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface BannerProps {
  images: string[];
  bucketId?: string;
  projectId?: string;
}

const Banner: React.FC<BannerProps> = ({
  images,
  bucketId = '68f1dbf20008177d3acb',
  projectId = '68cb65a4000ab2fec182'
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        if (prevIndex === images.length - 1) {
          setIsTransitioning(true);
          setTimeout(() => setIsTransitioning(false), 50);
          return 0;
        }
        return prevIndex + 1;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [images.length, currentIndex, isPaused]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex(currentIndex === 0 ? images.length - 1 : currentIndex - 1);
  };

  const goToNext = () => {
    setCurrentIndex(currentIndex === images.length - 1 ? 0 : currentIndex + 1);
  };

  const getImageUrl = (imageId: string) => {
    if (imageId.startsWith('http')) {
      return imageId;
    }
    return `https://sgp.cloud.appwrite.io/v1/storage/buckets/${bucketId}/files/${imageId}/view?project=${projectId}`;
  };

  if (!images || images.length === 0) {
    return (
      <div className="w-full bg-gray-200 flex items-center justify-center" style={{ aspectRatio: '3/1' }}>
        <p className="text-gray-500 text-sm">No banner images available</p>
      </div>
    );
  }

  return (
    <div
      className="relative w-full overflow-hidden shadow-lg"
      style={{ aspectRatio: '3/1' }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Image Container */}
      <div
        className="flex transition-transform duration-500 ease-in-out h-full"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {images.map((image, index) => (
          <div key={index} className="w-full h-full shrink-0 relative">
            <Image
              src={getImageUrl(image)}
              alt={`Banner ${index + 1}`}
              fill
              className="object-cover"
              priority={index === 0}
              sizes="100vw"
            />
          </div>
        ))}
      </div>

      {/* Navigation Arrows - Optimized for mobile */}
      <button
        onClick={goToPrevious}
        className="absolute left-1 sm:left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-40 text-white p-1 sm:p-1.5 rounded-full hover:bg-opacity-60 transition-opacity duration-200 z-10 active:scale-95"
        aria-label="Previous image"
      >
        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={goToNext}
        className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-40 text-white p-1 sm:p-1.5 rounded-full hover:bg-opacity-60 transition-opacity duration-200 z-10 active:scale-95"
        aria-label="Next image"
      >
        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Dot Indicators - Mobile optimized */}
      <div className="absolute bottom-1.5 sm:bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1 sm:space-x-1.5 z-10">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-200 active:scale-110 ${index === currentIndex
                ? 'bg-[#27247b] scale-110 sm:scale-125'
                : 'bg-white bg-opacity-50 hover:bg-opacity-75'
              }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 w-full h-0.5 sm:h-1 bg-black bg-opacity-20">
        {/* Completed portion */}
        <div
          className="absolute top-0 left-0 h-full bg-white transition-all duration-300 ease-out"
          style={{
            width: `${(currentIndex / images.length) * 100}%`
          }}
        />
        {/* Current animating portion */}
        <div
          className="absolute top-0 h-full"
          style={{
            left: `${(currentIndex / images.length) * 100}%`,
            width: `${(1 / images.length) * 100}%`
          }}
        >
          <div
            key={currentIndex}
            className="h-full bg-white animate-progress origin-left"
            style={{
              animationPlayState: isPaused ? 'paused' : 'running'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Banner;