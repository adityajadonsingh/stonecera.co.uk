// FILE: frontend/src/app/components/Header.tsx
import Link from "next/link";
import Image from "next/image";
import type { Category, AppUser } from "@/lib/types";
import { getAllCategories } from "@/lib/api/category";
import CategoryMenu from "./CategoryMenu";
import AuthMenu from "./AuthMenu";
import { getCurrentUser } from "@/lib/auth";

const STRAPI = process.env.STRAPI_API_URL;

export default async function Header() {
  // Fetch categories (server-side helper)
  const categories = await getAllCategories();
  const currentUser = await getCurrentUser();

  return (
    <header className=" border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left: Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Image
                src="/media/logo.png"
                alt="Logo"
                width={48}
                height={48}
                priority
                className="h-10 w-auto"
              />
            </Link>
          </div>

          {/* Middle: Categories / product-category link + dropdown */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/product-category"
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Categories
            </Link>

            {/* CategoryMenu is a client component */}
            <CategoryMenu categories={categories as Category[]} />
          </div>

          {/* Right: Auth area */}
          <div className="flex items-center">
            <AuthMenu user={currentUser} />
          </div>
        </div>
      </div>
    </header>
  );
}