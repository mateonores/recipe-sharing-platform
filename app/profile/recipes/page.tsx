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
  categories?: { name: string } | null;
  ratings?: { rating: number }[];
};

export default function MyRecipesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Fetch user's recipes
  useEffect(() => {
    const fetchUserRecipes = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("recipes")
          .select(
            `
            *,
            categories(name),
            ratings(rating)
          `
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setRecipes(data || []);
      } catch (error) {
        console.error("Error fetching user recipes:", error);
        toast.error("Failed to load your recipes");
      } finally {
        setIsLoading(false);
      }
    };

    if (user && !authLoading) {
      fetchUserRecipes();
    }
  }, [user, authLoading]);

  // Calculate average rating
  const getAverageRating = (recipe: Recipe) => {
    if (!recipe.ratings || recipe.ratings.length === 0) return "0.0";
    const sum = recipe.ratings.reduce((acc, r) => acc + r.rating, 0);
    return (sum / recipe.ratings.length).toFixed(1);
  };

  // Handle recipe deletion
  const handleDeleteRecipe = async (recipeId: string, recipeTitle: string) => {
    if (!user) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${recipeTitle}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("recipes")
        .delete()
        .eq("id", recipeId)
        .eq("user_id", user.id);

      if (error) throw error;

      setRecipes((prev) => prev.filter((recipe) => recipe.id !== recipeId));
      toast.success("Recipe deleted successfully!");
    } catch (error) {
      console.error("Error deleting recipe:", error);
      toast.error("Failed to delete recipe. Please try again.");
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="container py-12 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading your recipes...</p>
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
            Please log in to view your recipes.
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
            <h1 className="text-3xl font-bold">My Recipes</h1>
            <p className="text-gray-600 mt-1">
              Manage and view all your created recipes
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/recipes/create">Create New Recipe</Link>
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
              <div className="text-2xl font-bold text-blue-600">
                {recipes.length}
              </div>
              <div className="text-sm text-gray-500">Total Recipes</div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {recipes.reduce(
                  (acc, recipe) => acc + (recipe.ratings?.length || 0),
                  0
                )}
              </div>
              <div className="text-sm text-gray-500">Total Reviews</div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {recipes.length > 0
                  ? (
                      recipes.reduce(
                        (acc, recipe) =>
                          acc + parseFloat(getAverageRating(recipe)),
                        0
                      ) / recipes.length
                    ).toFixed(1)
                  : "0.0"}
              </div>
              <div className="text-sm text-gray-500">Average Rating</div>
            </div>
          </Card>
        </div>

        {/* Recipes Grid */}
        {recipes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.map((recipe) => (
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
                        <span>{getAverageRating(recipe)}</span>
                        <span className="text-gray-500">
                          ({recipe.ratings?.length || 0})
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
                        <Link href={`/recipes/${recipe.id}`}>View</Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="flex-1"
                      >
                        <Link href={`/recipes/${recipe.id}/edit`}>Edit</Link>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          handleDeleteRecipe(recipe.id, recipe.title)
                        }
                        className="flex-1"
                      >
                        Delete
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
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                <path d="M8 18h1" />
                <path d="M12 18h6" />
                <path d="M8 14h1" />
                <path d="M12 14h6" />
                <path d="M8 10h1" />
                <path d="M12 10h6" />
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2">No recipes yet</h3>
            <p className="text-gray-500 mb-4">
              You haven&apos;t created any recipes yet. Start sharing your
              culinary creations with the community!
            </p>
            <Button asChild>
              <Link href="/recipes/create">Create Your First Recipe</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
