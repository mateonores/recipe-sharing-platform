"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Category = Database["public"]["Tables"]["categories"]["Row"] & {
  _count?: {
    recipes: number;
  };
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("categories")
          .select("*")
          .order("name");

        if (error) throw error;

        // Get recipe count for each category
        const categoriesWithCounts = await Promise.all(
          (data || []).map(async (category) => {
            const { count } = await supabase
              .from("recipes")
              .select("id", { count: "exact" })
              .eq("category_id", category.id);

            return {
              ...category,
              _count: {
                recipes: count || 0,
              },
            };
          })
        );

        setCategories(categoriesWithCounts);
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error("Failed to load categories");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <div className="container px-4 py-12 md:px-6 md:py-16">
      <div className="flex flex-col gap-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            Recipe Categories
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Explore recipes organized by category. From breakfast to desserts,
            find exactly what you&apos;re craving.
          </p>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading categories...</p>
            </div>
          </div>
        )}

        {/* Categories grid */}
        {!isLoading && (
          <>
            {categories.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/categories/${category.slug}`}
                    className="block h-full"
                  >
                    <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                      <CardHeader className="text-center pb-4">
                        <div className="text-5xl mb-4">
                          {category.emoji || "🍽️"}
                        </div>
                        <CardTitle className="text-xl">
                          {category.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-center">
                        <p className="text-gray-500 line-clamp-3 mb-4">
                          {category.description ||
                            `Discover delicious ${category.name.toLowerCase()} recipes`}
                        </p>
                        <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                          <span>{category._count?.recipes || 0} recipes</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="64"
                    height="64"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mx-auto text-gray-400"
                  >
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No categories found
                </h3>
                <p className="text-gray-500 mb-6">
                  Categories will appear here once they&apos;re added to the
                  system.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
