"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { LogOut, User } from "lucide-react";

export function Header() {
  const { user, logout } = useAuthStore();

  if (!user) return null;

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/meetings" className="font-semibold text-xl">
          Meet Clone
        </Link>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <User size={20} />
            <span>{user.username}</span>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-red-600 hover:text-red-700"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
