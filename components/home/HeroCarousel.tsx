"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { HeroSlide } from "@/lib/catalog";
import { ChevronIcon } from "../icons";

/** Full-bleed hero that fades into the page (findings #13). Auto-advances every 5s, pauses on hover. */
export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const go = (d: number) => setI((x) => (x + d + slides.length) % slides.length);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setI((x) => (x + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [paused, slides.length]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured"
      className="relative h-[220px] overflow-hidden sm:h-[300px] lg:h-[600px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((s, idx) => (
        <Link
          key={s.cta + idx}
          href={s.cta}
          aria-hidden={idx !== i}
          tabIndex={idx === i ? 0 : -1}
          className={`absolute inset-0 transition-opacity duration-700 ${idx === i ? "opacity-100" : "pointer-events-none opacity-0"}`}
        >
          <Image src={s.image} alt={s.title} fill priority={idx === 0} sizes="100vw" className="object-cover object-center" />
          <span className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/10 to-transparent" />
          <span className="absolute left-[6%] top-[14%] max-w-[60%] text-white sm:top-[18%] lg:top-[12%]">
            <span className="block text-2xl font-bold drop-shadow sm:text-4xl lg:text-5xl">{s.title}</span>
            <span className="mt-3 hidden rounded-full bg-white/95 px-4 py-1.5 text-sm font-bold text-amz-text sm:inline-block">
              Shop now
            </span>
          </span>
        </Link>
      ))}
      {/* fade into the page background, like the live site */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-amz-bg to-transparent" />

      <button
        type="button"
        aria-label="Previous slide"
        onClick={() => go(-1)}
        className="absolute left-0 top-0 hidden h-[250px] w-20 items-center justify-center text-white/90 outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-white lg:flex"
      >
        <ChevronIcon dir="left" className="h-12 w-12 drop-shadow" />
      </button>
      <button
        type="button"
        aria-label="Next slide"
        onClick={() => go(1)}
        className="absolute right-0 top-0 hidden h-[250px] w-20 items-center justify-center text-white/90 outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-white lg:flex"
      >
        <ChevronIcon dir="right" className="h-12 w-12 drop-shadow" />
      </button>
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2 lg:bottom-auto lg:top-[260px]">
        {slides.map((_, idx) => (
          <button
            key={idx}
            type="button"
            aria-label={`Go to slide ${idx + 1}`}
            aria-current={idx === i}
            onClick={() => setI(idx)}
            className={`h-2 w-2 rounded-full ${idx === i ? "bg-white" : "bg-white/50"}`}
          />
        ))}
      </div>
    </section>
  );
}
