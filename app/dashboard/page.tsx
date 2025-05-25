"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  users?: {
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  categories?: {
    name: string;
  } | null;
  ratings?: { rating: number }[];
  _count?: {
    favorites: number;
    comments: number;
  };
  isFavorited?: boolean;
};

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Fetch recipes from other users
  useEffect(() => {
    const fetchRecipes = async () => {
      if (!user) return;

      try {
        setIsLoading(true);

        // Get recipes from other users (not the current user)
        const { data, error } = await supabase
          .from("recipes")
          .select(
            `
            *,
            users(username, full_name, avatar_url),
            categories(name),
            ratings(rating)
          `
          )
          .neq("user_id", user.id) // Exclude current user's recipes
          .order("created_at", { ascending: false })
          .limit(12);

        if (error) throw error;

        // Get favorites and comments count for each recipe, plus check if user has favorited each recipe
        const recipesWithCounts = await Promise.all(
          (data || []).map(async (recipe) => {
            try {
              const [favoritesCount, commentsCount, userFavorite] =
                await Promise.all([
                  supabase
                    .from("favorites")
                    .select("id", { count: "exact" })
                    .eq("recipe_id", recipe.id),
                  supabase
                    .from("comments")
                    .select("id", { count: "exact" })
                    .eq("recipe_id", recipe.id),
                  supabase
                    .from("favorites")
                    .select("id")
                    .eq("recipe_id", recipe.id)
                    .eq("user_id", user.id)
                    .maybeSingle(), // Use maybeSingle instead of single to avoid errors when no record exists
                ]);

              return {
                ...recipe,
                _count: {
                  favorites: favoritesCount.count || 0,
                  comments: commentsCount.count || 0,
                },
                isFavorited: !!userFavorite.data,
              };
            } catch (recipeError) {
              console.error(
                `Error processing recipe ${recipe.id}:`,
                recipeError
              );
              // Return recipe with default values if there's an error
              return {
                ...recipe,
                _count: {
                  favorites: 0,
                  comments: 0,
                },
                isFavorited: false,
              };
            }
          })
        );

        setRecipes(recipesWithCounts);
      } catch (error) {
        console.error("Error fetching recipes:", error);
        toast.error("Failed to load recipes");
      } finally {
        setIsLoading(false);
      }
    };

    if (user && !authLoading) {
      fetchRecipes();
    }
  }, [user, authLoading]);

  // Calculate average rating
  const getAverageRating = (recipe: Recipe) => {
    if (!recipe.ratings || recipe.ratings.length === 0) return 0;
    const sum = recipe.ratings.reduce((acc, r) => acc + r.rating, 0);
    return (sum / recipe.ratings.length).toFixed(1);
  };

  // Toggle favorite
  const toggleFavorite = async (recipeId: string, isFavorited: boolean) => {
    if (!user) {
      toast.error("Please log in to save recipes");
      return;
    }

    try {
      if (isFavorited) {
        // Remove from favorites
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("recipe_id", recipeId)
          .eq("user_id", user.id);

        if (error) {
          console.error("Error removing from favorites:", error);
          throw error;
        }
        toast.success("Removed from favorites");
      } else {
        // Add to favorites
        const { error } = await supabase.from("favorites").insert({
          recipe_id: recipeId,
          user_id: user.id,
        });

        if (error) {
          console.error("Error adding to favorites:", error);
          // Check if it's a duplicate key error (user already favorited this recipe)
          if (error.code === "23505") {
            toast.error("Recipe is already in your favorites");
            return;
          }
          throw error;
        }
        toast.success("Added to favorites");
      }

      // Update the recipe state
      setRecipes((prev) =>
        prev.map((recipe) => {
          if (recipe.id === recipeId) {
            return {
              ...recipe,
              _count: {
                ...recipe._count!,
                favorites: isFavorited
                  ? recipe._count!.favorites - 1
                  : recipe._count!.favorites + 1,
              },
              isFavorited: !isFavorited,
            };
          }
          return recipe;
        })
      );
    } catch (error) {
      console.error("Error toggling favorite:", error);

      // More specific error messages
      if (error && typeof error === "object" && "message" in error) {
        toast.error(`Failed to update favorite: ${error.message}`);
      } else if (error && typeof error === "object" && "code" in error) {
        toast.error(
          `Database error (${error.code}): Failed to update favorite`
        );
      } else {
        toast.error("Failed to update favorite. Please try again.");
      }
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="container py-8 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-gray-200 h-80 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container py-8 px-4 md:px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            Please log in to view the dashboard.
          </p>
          <Button asChild>
            <Link href="/login">Go to Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 px-4 md:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Discover amazing recipes from our community
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/recipes/create">Create Recipe</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/profile">My Profile</Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {recipes.length}
              </div>
              <div className="text-sm text-gray-500">Recipes Available</div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {recipes.reduce(
                  (acc, recipe) => acc + (recipe._count?.favorites || 0),
                  0
                )}
              </div>
              <div className="text-sm text-gray-500">Total Favorites</div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {new Set(recipes.map((recipe) => recipe.users?.username)).size}
              </div>
              <div className="text-sm text-gray-500">Active Chefs</div>
            </div>
          </Card>
        </div>

        {/* Recipes Grid */}
        {recipes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.map((recipe) => (
              <Card
                key={recipe.id}
                className="overflow-hidden group hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/recipes/${recipe.id}`)}
              >
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

                    {/* Author */}
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage
                          src={recipe.users?.avatar_url || ""}
                          alt={recipe.users?.username || ""}
                        />
                        <AvatarFallback className="text-xs">
                          {recipe.users?.username
                            ?.substring(0, 2)
                            .toUpperCase() || "??"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-gray-600">
                        by{" "}
                        {recipe.users?.full_name ||
                          recipe.users?.username ||
                          "Unknown"}
                      </span>
                    </div>

                    {/* Actions and stats */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <svg
                            className="w-4 h-4 text-yellow-400"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                          <span>{getAverageRating(recipe) || "0.0"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                          </svg>
                          <span>{recipe._count?.favorites || 0}</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent card click navigation
                            toggleFavorite(
                              recipe.id,
                              recipe.isFavorited || false
                            );
                          }}
                          className={`h-8 w-8 p-0 ${
                            recipe.isFavorited
                              ? "text-red-500"
                              : "text-gray-400"
                          }`}
                        >
                          <svg
                            className="w-4 h-4"
                            fill={recipe.isFavorited ? "currentColor" : "none"}
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                          </svg>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent card click navigation
                            router.push(`/recipes/${recipe.id}`);
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No recipes found
              </h3>
              <p className="text-gray-500 mb-4">
                Be the first to share a recipe with the community!
              </p>
              <Button asChild>
                <Link href="/recipes/create">Create Your First Recipe</Link>
              </Button>
            </div>
          </div>
        )}

        {/* Load more */}
        {recipes.length > 0 && (
          <div className="text-center mt-8">
            <Button variant="outline" asChild>
              <Link href="/recipes">View All Recipes</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
