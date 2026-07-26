'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WelcomeAnimation({ onComplete }: { onComplete?: () => void }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Check if user has already seen the intro in this session
    const hasSeenIntro = sessionStorage.getItem('smartshamba_intro_seen');
    if (hasSeenIntro) {
      setIsVisible(false);
      onComplete?.();
      return;
    }

    // Extended duration to 4.5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      sessionStorage.setItem('smartshamba_intro_seen', 'true');
      onComplete?.();
    }, 4500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="welcome-splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#002816] text-white overflow-hidden pointer-events-none"
        >
          {/* Ambient Background Glow */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: [0.5, 1.5, 1], opacity: [0, 0.4, 0.2] }}
            transition={{ duration: 3, ease: "easeOut" }}
            className="absolute w-[600px] h-[600px] rounded-full bg-amber-500/10 blur-3xl pointer-events-none"
          />

          {/* SVG Sketch Animation Area */}
          <div className="relative z-10 flex items-center justify-center h-[220px] w-[220px] mb-8">
            <svg width="220" height="220" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute">
              
              {/* 1. Drawing the Maize Stalk (0s - 1.5s) */}
              <motion.path
                d="M100 180 Q 110 120 100 80"
                stroke="#10B981"
                strokeWidth="4"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />

              {/* 2. Drawing the Left Leaf (0.8s - 2.0s) */}
              <motion.path
                d="M105 140 Q 50 120 30 150"
                stroke="#10B981"
                strokeWidth="4"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, delay: 0.8, ease: "easeInOut" }}
              />

              {/* 3. Drawing the Right Leaf (1.2s - 2.4s) */}
              <motion.path
                d="M105 120 Q 160 100 180 130"
                stroke="#10B981"
                strokeWidth="4"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, delay: 1.2, ease: "easeInOut" }}
              />

              {/* 4. The Golden Maize Cob Appears (2.0s - 2.8s) */}
              <motion.path
                d="M100 80 Q 90 40 100 20 Q 110 40 100 80 Z"
                fill="#F59E0B"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 2.0, ease: "backOut" }}
                style={{ transformOrigin: '100px 50px' }}
              />

              {/* 5. Maize Kernels Detail (2.8s - 3.2s) */}
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 2.8 }}
              >
                <circle cx="96" cy="40" r="2" fill="#002816" />
                <circle cx="104" cy="40" r="2" fill="#002816" />
                <circle cx="100" cy="48" r="2" fill="#002816" />
                <circle cx="96" cy="56" r="2" fill="#002816" />
                <circle cx="104" cy="56" r="2" fill="#002816" />
                <circle cx="100" cy="64" r="2" fill="#002816" />
              </motion.g>
            </svg>
          </div>

          {/* Brand Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.4, duration: 0.8, ease: "easeOut" }}
            className="text-4xl md:text-5xl font-extrabold tracking-tight text-white"
          >
            Smart<span className="text-emerald-400">Shamba</span>
          </motion.h1>

          {/* Subtitle / Value Prop */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 3.0, duration: 0.6 }}
            className="mt-3 text-xs md:text-sm font-medium tracking-[0.2em] uppercase text-emerald-200/80"
          >
            Direct • Transparent • Connected
          </motion.p>

          {/* Bottom Loading Indicator */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "200px" }}
            transition={{ delay: 1.5, duration: 3, ease: "easeInOut" }}
            className="absolute bottom-16 h-[3px] bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
