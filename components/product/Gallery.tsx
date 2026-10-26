"use client";

import Image from "next/image";
import { useState } from "react";

/** F5 gallery: vertical thumbnails (horizontal on mobile), hover/click swaps, hover zoom follows the cursor. */
export function Gallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const src = images[active] ?? images[0];

  return (
    <div className="flex flex-col-reverse gap-3 lg:sticky lg:top-[115px] lg:flex-row">
      {images.length > 1 && (
        <ul className="no-scrollbar flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {images.map((img, i) => (
            <li key={img}>
              <button
                type="button"
                aria-label={`Image ${i + 1}`}
                aria-current={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => setActive(i)}
                className={`flex h-[52px] w-[44px] items-center justify-center overflow-hidden rounded-md border bg-white p-0.5 ${
                  i === active ? "border-amz-link shadow-[0_0_3px_2px_rgba(228,121,17,.5)]" : "border-[#a2a6ac] hover:border-amz-link"
                }`}
              >
                <Image src={img} alt="" width={44} height={52} className="h-full w-full object-contain" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div
        className="relative aspect-square w-full cursor-zoom-in overflow-hidden bg-white"
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
        }}
        onMouseLeave={() => setZoom(null)}
      >
        <Image
          key={src}
          src={src}
          alt={title}
          fill
          priority
          sizes="(min-width: 1024px) 40vw, 100vw"
          className="object-contain transition-transform duration-150"
          style={zoom ? { transform: "scale(1.8)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
        />
      </div>
    </div>
  );
}
