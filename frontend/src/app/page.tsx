import Link from "next/link";

export default function Home() {
  return (
    <>
      <h1 className="text-center text-3xl font-bold mt-10 mb-8">Home Page</h1>
      <ul className="flex gap-x-4 justify-center">
        <li className="p-4 bg-black font-semibold">
          <Link href={"/product-category/"}>Product Category</Link>
        </li>
        <li className="p-4 bg-black font-semibold">
          <Link href={"/products/"}>Products</Link>
        </li>
      </ul>
    </>
  );
}
