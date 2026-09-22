"use client";

import Link from "next/link";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, ShieldCheck, Phone, Truck } from "lucide-react";

export default function HeroSection() {
  const heroRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  // Track scroll progress specifically relative to the Hero section
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  // Parallax effect for the highlighted word
  const highlightedWordY = useTransform(
    scrollYProgress,
    [0, 1],
    [0, prefersReducedMotion ? 0 : -60] // Moves upward dynamically relative to the rest of the text
  );

  const highlightedWordOpacity = useTransform(
    scrollYProgress,
    [0, 0.8, 1],
    [1, prefersReducedMotion ? 1 : 0.8, prefersReducedMotion ? 1 : 0.4]
  );

  // Subtle fade and upward movement for the entire content block
  const contentY = useTransform(
    scrollYProgress,
    [0, 1],
    [0, prefersReducedMotion ? 0 : -30]
  );

  const contentOpacity = useTransform(
    scrollYProgress,
    [0, 0.9],
    [1, prefersReducedMotion ? 1 : 0]
  );

  return (
    <section
      ref={heroRef}
      className="relative w-full h-[88vh] min-h-[600px] flex items-center overflow-hidden bg-gray-900"
    >
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/images/Farmer-holdingphone-inthefarm.png" 
          alt="Farmer using a mobile phone in a maize field in Kenya" 
          className="w-full h-full object-cover object-center md:object-right" 
        />
        {/* Desktop: Left-to-right gradient scrim for text safety */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent hidden md:block"></div>
        {/* Mobile: Bottom-to-top gradient for text safety */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent md:hidden"></div>
      </div>

      {/* Content Overlay */}
      <motion.div 
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full"
      >
        <div className="max-w-2xl">
          <p className="text-lime-400 font-semibold text-xs sm:text-sm uppercase tracking-[0.2em] mb-5 drop-shadow-md">
            Rift Valley & Western Kenya &middot; 2026
          </p>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight mb-6 drop-shadow-lg">
            Direct,{" "}
            <motion.span 
              style={{ y: highlightedWordY, opacity: highlightedWordOpacity }}
              className="inline-block text-lime-400 drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
            >
              Transparent
            </motion.span>{" "}
            Maize Trading for Kenya&rsquo;s Farmers & Buyers
          </h1>
          
          <p className="text-base sm:text-lg text-gray-100 leading-relaxed max-w-xl mb-8 drop-shadow-md">
            SmartShamba connects farmers and buyers across Rift Valley & Western Kenya through coordinated transactions, USSD and web access, transport coordination, and settlement workflows.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              href="/ussd" 
              className="inline-flex items-center justify-center gap-2 bg-[#00703C] text-white px-7 py-3.5 rounded-lg text-sm font-bold hover:bg-[#00582f] transition-colors shadow-lg"
            >
              Launch USSD Demo <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              href="/buyers" 
              className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border-2 border-white/40 text-white px-7 py-3.5 rounded-lg text-sm font-bold hover:bg-white/20 transition-colors"
            >
              View Verified Buyers
            </Link>
          </div>
          
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-10 pt-8 border-t border-white/20">
            <div className="flex items-center gap-2 text-sm text-gray-200">
              <ShieldCheck className="w-4 h-4 text-lime-400" />
              <span className="font-medium">Verified Buyers</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-200">
              <Phone className="w-4 h-4 text-lime-400" />
              <span className="font-medium">USSD + M-PESA</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-200">
              <Truck className="w-4 h-4 text-lime-400" />
              <span className="font-medium">Transport Coordination</span>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
