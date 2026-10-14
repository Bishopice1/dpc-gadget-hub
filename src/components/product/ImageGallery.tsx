"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function ImageGallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const gallery = images.length > 0 ? images : ["/products/placeholder.svg"];
  const [active, setActive] = useState(0);
  const current = gallery[active] ?? gallery[0];

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-line bg-surface-2">
        <Image
          src={current}
          alt={`${alt} — image ${active + 1} of ${gallery.length}`}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
      </div>
      {gallery.length > 1 && (
        <ul className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-4">
          {gallery.map((image, index) => (
            <li key={image}>
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-label={`View image ${index + 1} of ${gallery.length}`}
                aria-current={active === index}
                className={cn(
                  "relative aspect-square w-full overflow-hidden rounded-lg border-2 bg-surface-2 transition-colors",
                  active === index
                    ? "border-accent"
                    : "border-transparent hover:border-line",
                )}
              >
                <Image
                  src={image}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}