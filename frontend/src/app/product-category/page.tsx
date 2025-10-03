import Link from "next/link";
import Image from "next/image";
import { getAllCategories } from "@/lib/api/category";
export default async function ProductCategoryPage() {
  const categories = await getAllCategories();
  console.log(categories);
  return (
    <>
      <h1 className="text-center text-3xl font-bold mt-10 mb-8">
        Product Category Page
      </h1>
      <div className="px-10">
        <div className="grid grid-cols-4">
          <div className="card"></div>
        </div>
      </div>
    </>
  );
}
