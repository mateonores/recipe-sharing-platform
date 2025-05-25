"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Recipe = Database["public"]["Tables"]["recipes"]["Row"] & {
  users?: { username: string; full_name: string | null };
  categories?: { name: string } | null;
  comments?: { rating: number | null }[];
  _count?: { comments: number };
};

type Category = Database["public"]["Tables"]["categories"]["Row"];

export default function RecipesPage() {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch recipes
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setIsLoading(true);
        let query = supabase
          .from("recipes")
          .select(
            `
            *,
            users(username, full_name),
            categories(name),
            comments(rating)
          `
          )
          .order("created_at", { ascending: false });

        // Apply category filter
        if (selectedCategory) {
          query = query.eq("category_id", selectedCategory);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Filter by search term on the client side
        let filteredRecipes = data || [];
        if (searchTerm) {
          filteredRecipes = filteredRecipes.filter(
            (recipe) =>
              recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              recipe.description
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase())
          );
        }

        setRecipes(filteredRecipes);
      } catch (error) {
        console.error("Error fetching recipes:", error);
        toast.error("Failed to load recipes");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecipes();
  }, [selectedCategory, searchTerm]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from("categories")
          .select("*")
          .order("name");

        if (error) throw error;
        setCategories(data || []);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  // Calculate average rating from comments
  const getAverageRating = (recipe: Recipe) => {
    if (!recipe.comments) return "0";
    const ratingsOnly = recipe.comments
      .map((c) => c.rating)
      .filter((rating): rating is number => rating !== null);

    if (ratingsOnly.length === 0) return "0";

    const sum = ratingsOnly.reduce((acc, r) => acc + r, 0);
    return (sum / ratingsOnly.length).toFixed(1);
  };

  // Get ratings count
  const getRatingsCount = (recipe: Recipe) => {
    if (!recipe.comments) return 0;
    return recipe.comments.filter((c) => c.rating !== null).length;
  };

  return (
    <div className="container px-4 py-12 md:px-6 md:py-16">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Browse Recipes</h1>
          <p className="text-gray-500">
            Discover delicious recipes from our community
          </p>
        </div>

        {/* Search and filter */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="w-full md:max-w-sm">
            <Input
              placeholder="Search recipes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              className="h-8"
              onClick={() => setSelectedCategory(null)}
            >
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={
                  selectedCategory === category.id ? "default" : "outline"
                }
                size="sm"
                className="h-8"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.emoji && `${category.emoji} `}
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading recipes...</p>
            </div>
          </div>
        )}

        {/* Recipe grid */}
        {!isLoading && (
          <>
            {recipes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {recipes.map((recipe) => (
                  <div key={recipe.id}>
                    <Link
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
                              {recipe.categories?.name || "Uncategorized"}
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
                  </div>
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
                    <path d="M8 18h1" />
                    <path d="M12 18h6" />
                    <path d="M8 14h1" />
                    <path d="M12 14h6" />
                    <path d="M8 10h1" />
                    <path d="M12 10h6" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No recipes found
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm || selectedCategory
                    ? "Try adjusting your search or filter criteria."
                    : "Be the first to share a recipe with the community!"}
                </p>
                {user && (
                  <Button asChild>
                    <Link href="/recipes/create">Create Recipe</Link>
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
