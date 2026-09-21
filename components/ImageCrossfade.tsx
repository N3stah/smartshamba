"use client";
import { useState, useEffect } from "react";

interface CrossfadeImage {
  src: string;
  alt: string;
}

export default function ImageCrossfade({ 
  images, 
  interval = 3500, 
  className = "",
  imgClassName = ""
}: { 
  images: CrossfadeImage[]; 
  interval?: number; 
  className?: string;
  imgClassName?: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion || images.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, interval);

    return () => clearInterval(timer);
  }, [images.length, interval]);

  return (
    <div className={"relative overflow-hidden " + className}>
      {images.map((img, index) => (
        <img
          key={index}
          src={img.src}
          alt={img.alt}
          className={"absolute inset-0 w-full h-full object-cover transition-opacity duration-700 " + imgClassName + " " + (
            index === currentIndex ? "opacity-100" : "opacity-0"
          )}
          loading={index === 0 ? "eager" : "lazy"}
        />
      ))}
    </div>
  );
}
