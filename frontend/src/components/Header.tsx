
import Link from "next/link";
import Image from "next/image";
import type { Category } from "@/lib/types";
import CategoryMenu from "./CategoryMenu";
import AuthMenu from "./AuthMenu";
import { getAllCategories } from "@/lib/api/category";

export default async function Header(){
  const categories: Category[] = await getAllCategories();

  return (
    <header className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Image src="/media/logo.png" alt="Logo" width={48} height={48} className="h-10 w-auto" />
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/product-category" className="text-sm font-medium text-gray-700 hover:text-gray-900">
              Categories
            </Link>
            <CategoryMenu categories={categories} />
          </div>

          <div className="flex items-center">
            <AuthMenu /> 
          </div>
        </div>
      </div>
    </header>
  );
}