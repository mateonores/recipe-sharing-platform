"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type UserProfile = Database["public"]["Tables"]["users"]["Row"];
type Recipe = Database["public"]["Tables"]["recipes"]["Row"] & {
  categories?: { name: string } | null;
  ratings?: { rating: number }[];
};
type SavedRecipe = Recipe & {
  author?: string;
};

export default function ProfilePage() {
  const { user, isLoading: authLoading, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "my-recipes" | "saved" | "settings"
  >("my-recipes");

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userRecipes, setUserRecipes] = useState<Recipe[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) throw error;
        setUserProfile(data);
      } catch (error) {
        console.error("Error fetching user profile:", error);
        toast.error("Failed to load profile data");
      }
    };

    if (user && !authLoading) {
      fetchUserProfile();
    }
  }, [user, authLoading]);

  // Fetch user's recipes
  useEffect(() => {
    const fetchUserRecipes = async () => {
      if (!user) return;

      try {
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
        setUserRecipes(data || []);
      } catch (error) {
        console.error("Error fetching user recipes:", error);
        toast.error("Failed to load your recipes");
      }
    };

    if (user && !authLoading) {
      fetchUserRecipes();
    }
  }, [user, authLoading]);

  // Fetch saved recipes
  useEffect(() => {
    const fetchSavedRecipes = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("favorites")
          .select(
            `
            recipes(
              *,
              categories(name),
              ratings(rating),
              users(username)
            )
          `
          )
          .eq("user_id", user.id);

        if (error) throw error;

        const formattedRecipes: SavedRecipe[] =
          data?.map((item) => {
            const recipe = item.recipes as unknown as Recipe;
            const users = (
              item.recipes as unknown as { users?: { username: string } }
            )?.users;
            return {
              ...recipe,
              author: users?.username || "Unknown",
            };
          }) || [];

        setSavedRecipes(formattedRecipes);
      } catch (error) {
        console.error("Error fetching saved recipes:", error);
        toast.error("Failed to load saved recipes");
      }
    };

    if (user && !authLoading) {
      fetchSavedRecipes();
    }
  }, [user, authLoading]);

  // Set loading to false when all data is fetched
  useEffect(() => {
    if (!authLoading && userProfile) {
      setIsLoading(false);
    }
  }, [authLoading, userProfile]);

  // Handle photo upload
  const handlePhotoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user || !userProfile) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setIsUploadingPhoto(true);
    try {
      // Create unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("recipe-images")
        .upload(`avatars/${fileName}`, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage
        .from("recipe-images")
        .getPublicUrl(`avatars/${fileName}`);

      // Update user profile with new avatar URL
      const { error: updateError } = await supabase
        .from("users")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Update local state
      setUserProfile({ ...userProfile, avatar_url: publicUrl });

      // Refresh profile in header
      await refreshProfile();

      toast.success("Profile photo updated successfully!");
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error("Failed to upload photo. Please try again.");
    } finally {
      setIsUploadingPhoto(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Handle profile update
  const handleUpdateProfile = async (formData: FormData) => {
    if (!user || !userProfile) return;

    setIsUpdating(true);
    try {
      const updates = {
        username: formData.get("username") as string,
        full_name: formData.get("full_name") as string,
        bio: formData.get("bio") as string,
      };

      const { error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", user.id);

      if (error) throw error;

      setUserProfile({ ...userProfile, ...updates });
      toast.success("Profile updated successfully!");

      // Switch to "my-recipes" tab after successful update
      setActiveTab("my-recipes");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  // Calculate average rating for a recipe
  const getAverageRating = (recipe: Recipe) => {
    if (!recipe.ratings || recipe.ratings.length === 0) return 0;
    const sum = recipe.ratings.reduce((acc, r) => acc + r.rating, 0);
    return (sum / recipe.ratings.length).toFixed(1);
  };

  // Delete recipe handler
  const handleDeleteRecipe = async (recipeId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("recipes")
        .delete()
        .eq("id", recipeId)
        .eq("user_id", user.id);

      if (error) throw error;

      setUserRecipes((prev) => prev.filter((recipe) => recipe.id !== recipeId));
      toast.success("Recipe deleted successfully!");
    } catch (error) {
      console.error("Error deleting recipe:", error);
      toast.error("Failed to delete recipe");
    }
  };

  // Unsave recipe handler
  const handleUnsaveRecipe = async (recipeId: string) => {
    if (!user) return;

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
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="flex items-center gap-8">
              <div className="w-32 h-32 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-16 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !userProfile) {
    return (
      <div className="container py-12 px-4 md:px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Profile not found</h1>
          <p className="text-gray-600 mb-4">
            Please log in to view your profile.
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
      <div className="max-w-5xl mx-auto">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-center gap-8 mb-10">
          <Avatar className="w-32 h-32">
            <AvatarImage
              src={userProfile.avatar_url || "/placeholder-avatar.jpg"}
              alt={userProfile.username}
            />
            <AvatarFallback>
              {userProfile.full_name
                ? `${userProfile.full_name.split(" ")[0][0]}${
                    userProfile.full_name.split(" ")[1]?.[0] || ""
                  }`
                : userProfile.username.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-center md:text-left">
            {userProfile.full_name && (
              <h1 className="text-3xl font-bold mb-1">
                {userProfile.full_name}
              </h1>
            )}
            <div
              className={`${
                userProfile.full_name
                  ? "text-lg text-gray-600 mb-3"
                  : "text-3xl font-bold mb-2"
              }`}
            >
              @{userProfile.username}
            </div>
            <p className="text-gray-500 max-w-md mb-4">
              {userProfile.bio || "No bio available"}
            </p>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              <div className="bg-slate-100 px-3 py-1 rounded-full text-sm">
                <span className="font-medium">{userRecipes.length}</span>{" "}
                Recipes
              </div>
              <div className="bg-slate-100 px-3 py-1 rounded-full text-sm">
                <span className="font-medium">{savedRecipes.length}</span> Saved
              </div>
              <div className="bg-slate-100 px-3 py-1 rounded-full text-sm">
                <span className="font-medium">
                  {new Date(userProfile.created_at).toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "long",
                    }
                  )}
                </span>{" "}
                Member since
              </div>
            </div>
          </div>
          <Button size="sm" onClick={() => setActiveTab("settings")}>
            Edit Profile
          </Button>
        </div>

        {/* Tabs */}
        <div className="border-b mb-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("my-recipes")}
              className={`pb-4 font-medium text-sm ${
                activeTab === "my-recipes"
                  ? "border-b-2 border-primary text-primary"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              My Recipes
            </button>
            <button
              onClick={() => setActiveTab("saved")}
              className={`pb-4 font-medium text-sm ${
                activeTab === "saved"
                  ? "border-b-2 border-primary text-primary"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Saved Recipes
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`pb-4 font-medium text-sm ${
                activeTab === "settings"
                  ? "border-b-2 border-primary text-primary"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Settings
            </button>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === "my-recipes" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">My Recipes</h2>
              <Button asChild>
                <Link href="/recipes/create">Create New Recipe</Link>
              </Button>
            </div>
            {userRecipes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {userRecipes.map((recipe) => (
                  <Card key={recipe.id} className="overflow-hidden">
                    <div className="relative aspect-video overflow-hidden">
                      <Image
                        src={recipe.image_url || "/placeholder-recipe.jpg"}
                        alt={recipe.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold line-clamp-1">
                            {recipe.title}
                          </h3>
                          <p className="text-sm text-gray-500 mb-2">
                            {recipe.categories?.name || "Uncategorized"}
                          </p>
                        </div>
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
                          <span className="text-sm">
                            {getAverageRating(recipe) || "0.0"}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-4">
                        <span className="text-xs text-gray-500">
                          {new Date(recipe.created_at).toLocaleDateString()}
                        </span>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/recipes/${recipe.id}/edit`}>
                              Edit
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRecipe(recipe.id)}
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
                <h3 className="text-lg font-medium mb-2">No recipes yet</h3>
                <p className="text-gray-500 mb-4">
                  You haven&apos;t created any recipes yet. Start sharing your
                  culinary creations!
                </p>
                <Button asChild>
                  <Link href="/recipes/create">Create Your First Recipe</Link>
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === "saved" && (
          <div>
            <h2 className="text-xl font-semibold mb-6">Saved Recipes</h2>
            {savedRecipes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedRecipes.map((recipe) => (
                  <Card key={recipe.id} className="overflow-hidden">
                    <div className="relative aspect-video overflow-hidden">
                      <Image
                        src={recipe.image_url || "/placeholder-recipe.jpg"}
                        alt={recipe.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <CardContent className="p-4">
                      <div>
                        <h3 className="font-semibold line-clamp-1">
                          {recipe.title}
                        </h3>
                        <p className="text-sm text-gray-500">
                          by {recipe.author || "Unknown"}
                        </p>
                      </div>
                      <div className="flex justify-between items-center mt-4">
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
                          <span className="text-sm">
                            {getAverageRating(recipe) || "0.0"}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnsaveRecipe(recipe.id)}
                        >
                          Unsave
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50 rounded-lg">
                <h3 className="text-lg font-medium mb-2">No saved recipes</h3>
                <p className="text-gray-500 mb-4">
                  You haven&apos;t saved any recipes yet. Browse recipes and
                  save your favorites!
                </p>
                <Button asChild>
                  <Link href="/recipes">Browse Recipes</Link>
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === "settings" && (
          <div className="max-w-2xl">
            <h2 className="text-xl font-semibold mb-6">Profile Settings</h2>
            <form action={handleUpdateProfile} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Profile Photo</label>
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage
                      src={userProfile.avatar_url || "/placeholder-avatar.jpg"}
                      alt={userProfile.username}
                    />
                    <AvatarFallback>
                      {userProfile.full_name
                        ? `${userProfile.full_name.split(" ")[0][0]}${
                            userProfile.full_name.split(" ")[1]?.[0] || ""
                          }`
                        : userProfile.username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingPhoto}
                    >
                      {isUploadingPhoto ? "Uploading..." : "Change Photo"}
                    </Button>
                    <p className="text-xs text-gray-500 mt-1">
                      JPG, PNG or GIF. Max size 5MB.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Username</label>
                <input
                  type="text"
                  name="username"
                  className="w-full p-2 border rounded-md"
                  defaultValue={userProfile.username}
                />
                <p className="text-xs text-gray-500">
                  This unique identifier is used in URLs and cannot contain
                  spaces
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <input
                  type="text"
                  name="full_name"
                  className="w-full p-2 border rounded-md"
                  defaultValue={userProfile.full_name || ""}
                  placeholder="Your full name (optional)"
                />
                <p className="text-xs text-gray-500">
                  Your display name shown on your profile and recipes
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <input
                  type="email"
                  className="w-full p-2 border rounded-md bg-gray-100"
                  value={userProfile.email}
                  disabled
                />
                <p className="text-xs text-gray-500">
                  Email cannot be changed from this page
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Bio</label>
                <textarea
                  name="bio"
                  className="w-full p-2 border rounded-md min-h-24"
                  defaultValue={userProfile.bio || ""}
                  placeholder="Tell us about yourself..."
                ></textarea>
              </div>

              <div className="pt-4">
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
