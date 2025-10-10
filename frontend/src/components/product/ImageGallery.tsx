// components/product/ImageGallery.tsx
"use client";

import type { ImageAttributes } from "@/lib/types";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export default function ImageGallery({ images = [] }: { images: ImageAttributes[] }) {
  const [index, setIndex] = useState(0);
  const thumbsRef = useRef<HTMLDivElement | null>(null);
  const selectedThumbRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (index >= images.length) setIndex(Math.max(0, images.length - 1));
  }, [images, index]);

  useEffect(() => {
    const btn = selectedThumbRef.current;
    const container = thumbsRef.current;
    if (!btn || !container) return;
    const btnRect = btn.getBoundingClientRect();
    const contRect = container.getBoundingClientRect();
    if (btnRect.left < contRect.left || btnRect.right > contRect.right) {
      btn.scrollIntoView({ behavior: "smooth", inline: "center" });
    }
  }, [index]);

  const base = process.env.NEXT_PUBLIC_MEDIA_URL ?? "";
  const main = images[index];

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
    if (e.key === "ArrowRight") setIndex((i) => Math.min(images.length - 1, i + 1));
  };

  return (
    <div>
      {/* Main image: simple responsive img (not absolute) */}
      <div
        className="w-full rounded overflow-hidden mb-4 bg-gray-100"
        style={{ height: "min(70vh, 560px)", maxHeight: "80vh" }}
        tabIndex={0}
        onKeyDown={onKey}
      >
        {main?.url ? (
          <Image
            src={base + main.url}
            alt={main.alt ?? "Product image"}
            width={1200}
            height={800}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 60vw, 45vw"
            className="object-cover w-full h-full"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            priority
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">No image</div>
        )}
      </div>

      {/* Thumbnails */}
      <div ref={thumbsRef} className="flex gap-2 overflow-x-auto py-1">
        {images.map((img, i) => {
          const isSelected = i === index;
          return (
            <button
              key={i}
              ref={isSelected ? selectedThumbRef : null}
              onClick={() => setIndex(i)}
              aria-pressed={isSelected}
              aria-label={`View image ${i + 1}`}
              className={`w-20 h-20 rounded overflow-hidden flex-shrink-0 focus:outline-none ${
                isSelected ? "ring-2 ring-amber-400" : "border border-gray-200"
              }`}
            >
              {img?.url ? (
                <Image
                  src={base + img.url}
                  alt={img.alt ?? ""}
                  width={80}
                  height={80}
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-300" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}