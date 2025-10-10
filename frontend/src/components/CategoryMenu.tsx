// FILE: frontend/src/app/components/CategoryMenu.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import type { Category } from "@/lib/types";

interface Props {
  categories: Category[];
}

export default function CategoryMenu({ categories = [] }: Props) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current || !btnRef.current) return;
      if (
        !menuRef.current.contains(e.target as Node) &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  return (
    <div className="relative inline-block text-left">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="inline-flex justify-center items-center gap-2 px-3 py-2 border rounded bg-white text-sm shadow-sm hover:bg-gray-50"
        aria-expanded={open}
        aria-haspopup="true"
      >
        Browse categories
        <svg
          className="w-4 h-4 text-gray-600"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M5.23 7.21a.75.75 0 011.06-.02L10 10.67l3.71-3.49a.75.75 0 011.04 1.08l-4.24 4a.75.75 0 01-1.04 0l-4.24-4a.75.75 0 01-.02-1.06z" />
        </svg>
      </button>

      {open && (
        <div
          ref={menuRef}
          className="absolute z-50 mt-2 w-56 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
        >
          <div className="py-1 max-h-64 overflow-auto">
            {categories.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500">No categories</div>
            )}
            {categories.map((cat) => (
              <Link
                key={cat.slug ?? String(cat.name)}
                href={`/product-category/${cat.slug}`}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setOpen(false)}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}