"use client";

import { Comments } from "@/components/Comments";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase";
import Image from "next/image";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type Recipe = Database["public"]["Tables"]["recipes"]["Row"] & {
  users?: {
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  categories?: { name: string } | null;
  ratings?: { rating: number }[];
  _count?: {
    favorites: number;
    comments: number;
  };
};

interface RecipePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function RecipePage({ params }: RecipePageProps) {
  const { user } = useAuth();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [recipeId, setRecipeId] = useState<string | null>(null);
  const router = useRouter();

  // Unwrap params
  useEffect(() => {
    const unwrapParams = async () => {
      const resolvedParams = await params;
      setRecipeId(resolvedParams.id);
    };
    unwrapParams();
  }, [params]);

  // Fetch recipe data
  useEffect(() => {
    if (!recipeId) return;

    const fetchRecipe = async () => {
      try {
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
          .eq("id", recipeId)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            // Recipe not found
            notFound();
          }
          throw error;
        }

        // Get favorites and comments count
        const [favoritesCount, commentsCount] = await Promise.all([
          supabase
            .from("favorites")
            .select("id", { count: "exact" })
            .eq("recipe_id", recipeId),
          supabase
            .from("comments")
            .select("id", { count: "exact" })
            .eq("recipe_id", recipeId),
        ]);

        setRecipe({
          ...data,
          _count: {
            favorites: favoritesCount.count || 0,
            comments: commentsCount.count || 0,
          },
        });

        // Check if user has favorited this recipe
        if (user) {
          const { data: favoriteData } = await supabase
            .from("favorites")
            .select("id")
            .eq("recipe_id", recipeId)
            .eq("user_id", user.id)
            .single();

          setIsFavorited(!!favoriteData);
        }
      } catch (error) {
        console.error("Error fetching recipe:", error);
        toast.error("Failed to load recipe");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecipe();
  }, [recipeId, user]);

  // Toggle favorite
  const toggleFavorite = async () => {
    if (!user || !recipe) return;

    try {
      if (isFavorited) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("recipe_id", recipe.id)
          .eq("user_id", user.id);

        if (error) throw error;
        setIsFavorited(false);
        setRecipe((prev) =>
          prev
            ? {
                ...prev,
                _count: {
                  ...prev._count!,
                  favorites: Math.max(0, prev._count!.favorites - 1),
                },
              }
            : null
        );
        toast.success("Recipe removed from favorites");
      } else {
        const { error } = await supabase.from("favorites").insert({
          recipe_id: recipe.id,
          user_id: user.id,
        });

        if (error) throw error;
        setIsFavorited(true);
        setRecipe((prev) =>
          prev
            ? {
                ...prev,
                _count: {
                  ...prev._count!,
                  favorites: prev._count!.favorites + 1,
                },
              }
            : null
        );
        toast.success("Recipe added to favorites");
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error("Failed to update favorite status");
    }
  };

  // Calculate average rating
  const getAverageRating = () => {
    if (!recipe?.ratings || recipe.ratings.length === 0) return 0;
    const sum = recipe.ratings.reduce((acc, r) => acc + r.rating, 0);
    return (sum / recipe.ratings.length).toFixed(1);
  };

  // Handle recipe deletion
  const handleDeleteRecipe = async () => {
    if (!user || !recipe || user.id !== recipe.user_id) {
      toast.error("You don't have permission to delete this recipe");
      return;
    }

    // Confirm deletion
    const confirmed = window.confirm(
      "Are you sure you want to delete this recipe? This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("recipes")
        .delete()
        .eq("id", recipe.id)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Recipe deleted successfully!");
      router.push("/recipes");
    } catch (error) {
      console.error("Error deleting recipe:", error);
      toast.error("Failed to delete recipe. Please try again.");
    }
  };

  // Memoize the comments count change callback to prevent infinite re-renders
  const handleCommentsCountChange = useCallback((count: number) => {
    setRecipe((prev) =>
      prev
        ? {
            ...prev,
            _count: {
              ...prev._count!,
              comments: count,
            },
          }
        : null
    );
  }, []);

  // Memoize the rating change callback to refresh recipe data
  const handleRatingChange = useCallback(() => {
    // Refetch recipe data to update ratings
    if (recipeId) {
      const fetchUpdatedRatings = async () => {
        try {
          const { data, error } = await supabase
            .from("recipes")
            .select("ratings(rating)")
            .eq("id", recipeId)
            .single();

          if (error) throw error;

          setRecipe((prev) =>
            prev
              ? {
                  ...prev,
                  ratings: data.ratings || [],
                }
              : null
          );
        } catch (error) {
          console.error("Error fetching updated ratings:", error);
        }
      };

      fetchUpdatedRatings();
    }
  }, [recipeId]);

  if (isLoading) {
    return (
      <div className="container py-12 px-4 md:px-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading recipe...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!recipe && !isLoading) {
    notFound();
  }

  if (!recipe) {
    return null; // This should never be reached due to notFound() above, but satisfies TypeScript
  }

  const ingredients = Array.isArray(recipe.ingredients)
    ? recipe.ingredients
    : typeof recipe.ingredients === "string"
    ? JSON.parse(recipe.ingredients)
    : [];

  const instructions = Array.isArray(recipe.instructions)
    ? recipe.instructions
    : typeof recipe.instructions === "string"
    ? JSON.parse(recipe.instructions)
    : [];

  return (
    <div className="container py-12 px-4 md:px-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        <div className="flex flex-col space-y-6">
          <Link
            href="/recipes"
            className="text-sm text-muted-foreground hover:underline inline-flex items-center gap-1 w-fit"
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
            Back to recipes
          </Link>

          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium px-2.5 py-0.5 rounded bg-blue-100 text-blue-800">
                {recipe.categories?.name || "Uncategorized"}
              </span>
              {recipe.time && (
                <span className="text-sm text-gray-500">
                  {recipe.time} mins
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {recipe.title}
            </h1>
            <p className="text-gray-500 text-lg">
              {recipe.description || "No description available"}
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarImage
                src={recipe.users?.avatar_url || ""}
                alt={recipe.users?.username || "User"}
              />
              <AvatarFallback>
                {recipe.users?.username?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">
                Recipe by{" "}
                {recipe.users?.full_name ||
                  recipe.users?.username ||
                  "Anonymous"}
              </p>
              <p className="text-sm text-gray-500">
                Published on {new Date(recipe.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
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
              <span className="font-medium">{getAverageRating()}</span>
              <span className="text-gray-500">
                ({recipe.ratings?.length || 0} reviews)
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {user && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleFavorite}
                  disabled={!user}
                >
                  {isFavorited ? "❤️ Saved" : "🤍 Save Recipe"}
                </Button>
              )}
              {user && user.id === recipe.user_id && (
                <>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/recipes/${recipe.id}/edit`}>
                      ✏️ Edit Recipe
                    </Link>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteRecipe}
                  >
                    🗑️ Delete
                  </Button>
                </>
              )}
            </div>
          </div>

          {recipe.image_url && (
            <div className="relative aspect-video overflow-hidden rounded-lg lg:hidden">
              <Image
                src={recipe.image_url}
                alt={recipe.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-3">Ingredients</h2>
              <ul className="space-y-2">
                {ingredients.map((ingredient: string, i: number) => (
                  <li
                    key={i}
                    className="flex items-center space-x-2 text-gray-700"
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
                      className="text-green-500"
                    >
                      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                    <span>{ingredient}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-3">Instructions</h2>
              <ol className="space-y-4">
                {instructions.map((instruction: string, i: number) => (
                  <li key={i} className="flex space-x-4">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center font-medium text-sm">
                      {i + 1}
                    </div>
                    <p className="text-gray-700">{instruction}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {recipe.image_url && (
            <div className="relative aspect-square overflow-hidden rounded-lg hidden lg:block">
              <Image
                src={recipe.image_url}
                alt={recipe.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          <div className="border p-6 rounded-lg">
            <Comments
              recipeId={recipe.id}
              recipeOwnerId={recipe.user_id}
              onCommentsCountChange={handleCommentsCountChange}
              onRatingChange={handleRatingChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
