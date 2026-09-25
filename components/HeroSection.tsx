"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, ShieldCheck, Phone, Truck } from "lucide-react";

export default function HeroSection() {
  const heroRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const contentY = useTransform(scrollYProgress, [0, 1], [0, prefersReducedMotion ? 0 : -30]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.9], [1, prefersReducedMotion ? 1 : 0]);

  return (
    <section
      ref={heroRef}
      className="relative min-h-[680px] h-[88vh] w-full overflow-hidden bg-gray-950"
    >
      <div className="absolute inset-0">
        <Image
          src="/images/Farmer-holdingphone-inthefarm.png"
          alt="Farmer using a mobile phone in a maize field"
          className="h-full w-full object-cover object-[68%_center] sm:object-[70%_center] lg:object-[72%_center]"
          priority
          fill
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/68 to-black/15" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent md:hidden" />
      </div>

      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-10 mx-auto flex h-full max-w-7xl items-center px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-3xl pt-14 sm:pt-16 lg:pt-0">
          <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-public-secondary sm:text-sm">
            Rift Valley & Western Kenya · 2026
          </p>
          <h1 className="text-4xl font-extrabold leading-[1.04] tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl">
            Direct, Transparent Maize Trading for Kenya&rsquo;s Farmers & Buyers
          </h1>
          <p className="mt-7 max-w-2xl text-base font-medium leading-7 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)] sm:text-lg lg:text-xl lg:leading-8">
            SmartShamba connects farmers and buyers across Rift Valley & Western Kenya through coordinated transactions, USSD and web access, transport coordination, and settlement workflows.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/ussd"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-public-primary px-7 py-3.5 text-sm font-bold text-white shadow-lg transition-all duration-200 hover:bg-public-primary/90 hover:-translate-y-0.5"
            >
              Launch USSD Demo
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/buyers"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-white/60 bg-white/10 px-7 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20 hover:-translate-y-0.5"
            >
              View Verified Buyers
            </Link>
          </div>
          <div className="mt-9 flex flex-wrap gap-x-7 gap-y-3 border-t border-white/20 pt-6">
            <div className="flex items-center gap-2 text-sm font-medium text-white">
              <ShieldCheck className="h-4 w-4 text-public-secondary" /> Verified Buyers
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-white">
              <Phone className="h-4 w-4 text-public-secondary" /> USSD + M-PESA
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-white">
              <Truck className="h-4 w-4 text-public-secondary" /> Transport Coordination
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
