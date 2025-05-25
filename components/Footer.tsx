"use client";

import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

export function Footer() {
  const { user } = useAuth();
  const homeUrl = user ? "/dashboard" : "/";

  return (
    <footer className="w-full border-t py-6 md:py-8">
      <div className="container flex flex-col items-center justify-center gap-4 md:flex-row md:justify-between">
        <div className="text-center md:text-left">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()}{" "}
            <Link href={homeUrl} className="hover:underline">
              RecipeShare
            </Link>
            . All rights reserved.
          </p>
        </div>
        <div className="flex gap-6">
          <Link
            href="/about"
            className="text-sm text-muted-foreground hover:underline"
          >
            About Us
          </Link>
          <Link
            href="/privacy"
            className="text-sm text-muted-foreground hover:underline"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="text-sm text-muted-foreground hover:underline"
          >
            Terms of Service
          </Link>
          <Link
            href="/contact"
            className="text-sm text-muted-foreground hover:underline"
          >
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}
