import Link from "next/link";
import Image from "next/image";
import { getAllCategories } from "@/lib/api/category";
export default async function ProductCategoryPage() {
  const categories = await getAllCategories();
  return (
    <>
      <h1 className="text-center text-3xl font-bold mt-10 mb-8">
        Product Category Page
      </h1>
      <div className="px-10">
        <div className="grid grid-cols-4 gap-6">
          {categories.map((category, i) => {
            console.log(process.env.NEXT_PUBLIC_MEDIA_URL+category.images[0]?.url);
            return (
              <Link key={i + "key"} href={`/product-category/${category.slug}`}>
                <div className="card h-48 relative">
                  <Image
                    src={
                      process.env.NEXT_PUBLIC_MEDIA_URL +
                        category.images[0]?.url || "/placeholder.png"
                    }
                    alt={category.images[0]?.alt || category.name}
                    fill
                    className="object-cover rounded-lg+"
                  />
                </div>
                <h2 className="text-center mt-2 font-semibold">
                  {category.name}
                </h2>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
