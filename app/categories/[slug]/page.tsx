"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Recipe = Database["public"]["Tables"]["recipes"]["Row"] & {
  users?: { username: string; full_name: string | null };
  categories?: { name: string } | null;
  comments?: { rating: number | null }[];
};

type Category = Database["public"]["Tables"]["categories"]["Row"];

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const { user } = useAuth();
  const [category, setCategory] = useState<Category | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [slug, setSlug] = useState<string | null>(null);

  // Unwrap params
  useEffect(() => {
    const unwrapParams = async () => {
      const resolvedParams = await params;
      setSlug(resolvedParams.slug);
    };
    unwrapParams();
  }, [params]);

  // Fetch category and recipes
  useEffect(() => {
    if (!slug) return;

    const fetchCategoryAndRecipes = async () => {
      try {
        setIsLoading(true);

        // First, find the category by slug
        const { data: categoryData, error: categoryError } = await supabase
          .from("categories")
          .select("*")
          .eq("slug", slug)
          .single();

        if (categoryError) throw categoryError;
        setCategory(categoryData);

        // Then fetch recipes for this category
        const { data: recipesData, error: recipesError } = await supabase
          .from("recipes")
          .select(
            `
            *,
            users(username, full_name),
            categories(name),
            comments(rating)
          `
          )
          .eq("category_id", categoryData.id)
          .order("created_at", { ascending: false });

        if (recipesError) throw recipesError;
        setRecipes(recipesData || []);
      } catch (error) {
        console.error("Error fetching category data:", error);
        if (
          error &&
          typeof error === "object" &&
          "code" in error &&
          error.code === "PGRST116"
        ) {
          // Category not found
          notFound();
        }
        toast.error("Failed to load category");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategoryAndRecipes();
  }, [slug]);

  // Calculate average rating from comments
  const getAverageRating = (recipe: Recipe) => {
    if (!recipe.comments) return 0;
    const ratingsOnly = recipe.comments
      .map((c) => c.rating)
      .filter((rating): rating is number => rating !== null);

    if (ratingsOnly.length === 0) return 0;

    const sum = ratingsOnly.reduce((acc, r) => acc + r, 0);
    return (sum / ratingsOnly.length).toFixed(1);
  };

  // Get ratings count
  const getRatingsCount = (recipe: Recipe) => {
    if (!recipe.comments) return 0;
    return recipe.comments.filter((c) => c.rating !== null).length;
  };

  if (isLoading) {
    return (
      <div className="container py-12 px-4 md:px-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading category...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!category && !isLoading) {
    notFound();
  }

  if (!category) {
    return null; // This should never be reached due to notFound() above, but satisfies TypeScript
  }

  return (
    <div className="container py-12 px-4 md:px-6">
      <div className="flex flex-col gap-8">
        {/* Category Header */}
        <div className="text-center space-y-4">
          <Link
            href="/categories"
            className="text-sm text-muted-foreground hover:underline inline-flex items-center gap-1 w-fit mx-auto"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back to categories
          </Link>

          <div className="space-y-2">
            <div className="text-6xl">{category.emoji || "🍽️"}</div>
            <h1 className="text-4xl font-bold tracking-tight">
              {category.name}
            </h1>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              {category.description ||
                `Discover delicious ${category.name.toLowerCase()} recipes`}
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
            <span>{recipes.length} recipes</span>
          </div>
        </div>

        {/* Recipes Grid */}
        {recipes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.map((recipe) => (
              <Link
                key={recipe.id}
                href={`/recipes/${recipe.id}`}
                className="block h-full"
              >
                <Card className="overflow-hidden h-full hover:shadow-md transition-shadow">
                  {recipe.image_url && (
                    <div className="relative aspect-video overflow-hidden">
                      <Image
                        src={recipe.image_url}
                        alt={recipe.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <CardHeader className="p-4">
                    <div className="flex gap-2 flex-wrap mb-2">
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        {category.name}
                      </span>
                      {recipe.time && (
                        <span className="text-xs px-2 py-1 bg-slate-100 text-slate-800 rounded">
                          {recipe.time} mins
                        </span>
                      )}
                    </div>
                    <CardTitle className="line-clamp-2 text-lg">
                      {recipe.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {recipe.description || "No description available"}
                    </p>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center space-x-1">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-yellow-400"
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        <span className="text-sm font-medium">
                          {getAverageRating(recipe)}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({getRatingsCount(recipe)})
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        by{" "}
                        {recipe.users?.full_name ||
                          recipe.users?.username ||
                          "Anonymous"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="mb-4">
              <div className="text-6xl opacity-50">
                {category.emoji || "🍽️"}
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No {category.name.toLowerCase()} recipes yet
            </h3>
            <p className="text-gray-500 mb-6">
              Be the first to share a {category.name.toLowerCase()} recipe with
              the community!
            </p>
            {user && (
              <Button asChild>
                <Link href="/recipes/create">Create Recipe</Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
