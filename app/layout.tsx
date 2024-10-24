"use client";

import { Inter } from "next/font/google";
import { usePathname } from "next/navigation";
import { Providers } from "@/components/providers";
import { Header } from "@/components/header";
import "./globals.css";
import AuthLayout from "./auth/layout";
const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage =
    pathname?.startsWith("/auth/login") ||
    pathname?.startsWith("/auth/register");

  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {isAuthPage ? (
            <AuthLayout>{children}</AuthLayout>
          ) : (
            <>
                <Header />
                <main className="container mx-auto px-4 py-8">{children}</main>
            </>
          )}
        </Providers>
      </body>
    </html>
  );
}
