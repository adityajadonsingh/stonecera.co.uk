"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/auth/LogoutButton";

const navLinks = [
  { href: "/account", label: "Dashboard" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/details", label: "Account details" },
];

export default function AccountSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col space-y-2">
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`px-4 py-2 rounded text-sm font-medium ${
            pathname === link.href
              ? "bg-gray-800 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {link.label}
        </Link>
      ))}
      <div className="pt-2">
        <LogoutButton />
      </div>
    </div>
  );
}