"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Recipe = Database["public"]["Tables"]["recipes"]["Row"] & {
  users?: { username: string; full_name: string | null };
  categories?: { name: string } | null;
  comments?: { rating: number | null }[];
};

type SavedRecipe = Recipe & {
  author: string;
};

export default function SavedRecipesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Fetch saved recipes
  useEffect(() => {
    const fetchSavedRecipes = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("favorites")
          .select(
            `
            *,
            recipes(
              *,
              users(username, full_name),
              categories(name),
              comments(rating)
            )
          `
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        const formattedRecipes: SavedRecipe[] =
          data?.map((item) => {
            const recipe = item.recipes as unknown as Recipe;
            const users = (
              item.recipes as unknown as {
                users?: { username: string; full_name: string | null };
              }
            )?.users;
            return {
              ...recipe,
              author: users?.full_name || users?.username || "Unknown",
            };
          }) || [];

        setSavedRecipes(formattedRecipes);
      } catch (error) {
        console.error("Error fetching saved recipes:", error);
        toast.error("Failed to load saved recipes");
      } finally {
        setIsLoading(false);
      }
    };

    if (user && !authLoading) {
      fetchSavedRecipes();
    }
  }, [user, authLoading]);

  // Calculate average rating from comments
  const getAverageRating = (recipe: Recipe) => {
    if (!recipe.comments) return "0.0";
    const ratingsOnly = recipe.comments
      .map((c) => c.rating)
      .filter((rating): rating is number => rating !== null);

    if (ratingsOnly.length === 0) return "0.0";

    const sum = ratingsOnly.reduce((acc, r) => acc + r, 0);
    return (sum / ratingsOnly.length).toFixed(1);
  };

  // Get ratings count
  const getRatingsCount = (recipe: Recipe) => {
    if (!recipe.comments) return 0;
    return recipe.comments.filter((c) => c.rating !== null).length;
  };

  // Handle unsaving recipe
  const handleUnsaveRecipe = async (recipeId: string, recipeTitle: string) => {
    if (!user) return;

    const confirmed = window.confirm(
      `Are you sure you want to remove "${recipeTitle}" from your saved recipes?`
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("recipe_id", recipeId)
        .eq("user_id", user.id);

      if (error) throw error;

      setSavedRecipes((prev) =>
        prev.filter((recipe) => recipe.id !== recipeId)
      );
      toast.success("Recipe removed from favorites!");
    } catch (error) {
      console.error("Error removing from favorites:", error);
      toast.error("Failed to remove from favorites");
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="container py-12 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading your saved recipes...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container py-12 px-4 md:px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            Please log in to view your saved recipes.
          </p>
          <Button asChild>
            <Link href="/login">Go to Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-12 px-4 md:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Saved Recipes</h1>
            <p className="text-gray-600 mt-1">
              Your collection of favorite recipes from the community
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/recipes">Browse More Recipes</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/profile">Back to Profile</Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {savedRecipes.length}
              </div>
              <div className="text-sm text-gray-500">Saved Recipes</div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {new Set(savedRecipes.map((recipe) => recipe.author)).size}
              </div>
              <div className="text-sm text-gray-500">Different Authors</div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {savedRecipes.length > 0
                  ? (
                      savedRecipes.reduce(
                        (acc, recipe) =>
                          acc + parseFloat(getAverageRating(recipe)),
                        0
                      ) / savedRecipes.length
                    ).toFixed(1)
                  : "0.0"}
              </div>
              <div className="text-sm text-gray-500">Average Rating</div>
            </div>
          </Card>
        </div>

        {/* Recipes Grid */}
        {savedRecipes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedRecipes.map((recipe) => (
              <Card key={recipe.id} className="overflow-hidden group">
                <div className="relative aspect-video overflow-hidden">
                  {recipe.image_url ? (
                    <Image
                      src={recipe.image_url}
                      alt={recipe.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-gray-400"
                      >
                        <rect
                          x="3"
                          y="3"
                          width="18"
                          height="18"
                          rx="2"
                          ry="2"
                        />
                        <circle cx="9" cy="9" r="2" />
                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                      </svg>
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Recipe info */}
                    <div>
                      <h3 className="font-semibold text-lg line-clamp-2 mb-1">
                        {recipe.title}
                      </h3>
                      <p className="text-sm text-gray-500 line-clamp-2">
                        {recipe.description || "No description available"}
                      </p>
                      <p className="text-sm text-blue-600 mt-1">
                        by {recipe.author}
                      </p>
                    </div>

                    {/* Category and time */}
                    <div className="flex items-center gap-2 text-sm">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                        {recipe.categories?.name || "Uncategorized"}
                      </span>
                      {recipe.time && (
                        <span className="text-gray-500">
                          {recipe.time} mins
                        </span>
                      )}
                    </div>

                    {/* Rating and stats */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
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
                      <span className="text-gray-500">
                        {new Date(recipe.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="flex-1"
                      >
                        <Link href={`/recipes/${recipe.id}`}>View Recipe</Link>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          handleUnsaveRecipe(recipe.id, recipe.title)
                        }
                        className="flex-1"
                      >
                        ❤️ Unsave
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-slate-50 rounded-lg">
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
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2">No saved recipes</h3>
            <p className="text-gray-500 mb-4">
              You haven&apos;t saved any recipes yet. Browse recipes and save
              your favorites!
            </p>
            <Button asChild>
              <Link href="/recipes">Browse Recipes</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
