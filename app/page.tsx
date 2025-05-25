"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!isLoading && user) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex flex-col gap-12 bg-slate-50 min-h-full">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 ">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-8 text-center">
            <div className="flex flex-col justify-center space-y-4 max-w-4xl">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl">
                  Share Your Culinary Masterpieces
                </h1>
                <p className="max-w-[600px] text-gray-500 md:text-xl mx-auto">
                  Join our community of food enthusiasts. Discover new recipes
                  or share your own creations with the world.
                </p>
              </div>

              {/* Conditional rendering based on authentication */}
              {isLoading ? (
                // Loading state
                <div className="flex flex-col gap-2 min-[400px]:flex-row justify-center">
                  <div className="h-12 bg-gray-200 rounded animate-pulse w-40"></div>
                  <div className="h-12 bg-gray-200 rounded animate-pulse w-40"></div>
                </div>
              ) : user ? (
                // User is logged in - show recipe buttons (this will be briefly visible before redirect)
                <div className="flex flex-col gap-2 min-[400px]:flex-row justify-center">
                  <Button asChild size="lg">
                    <Link href="/recipes/create">Share a Recipe</Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link href="/recipes">Browse Recipes</Link>
                  </Button>
                </div>
              ) : (
                // User is not logged in - show auth buttons (matching header order)
                <div className="flex flex-col gap-2 min-[400px]:flex-row justify-center">
                  <Button variant="outline" size="lg" asChild>
                    <Link href="/login">Log In</Link>
                  </Button>
                  <Button asChild size="lg">
                    <Link href="/signup">Sign Up</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
