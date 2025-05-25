"use client";

import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type UserProfile = Database["public"]["Tables"]["users"]["Row"];
type Recipe = Database["public"]["Tables"]["recipes"]["Row"] & {
  users?: { username: string; full_name: string | null };
  categories?: { name: string } | null;
  comments?: { rating: number | null }[];
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
        const { data: userRecipes, error: recipesError } = await supabase
          .from("recipes")
          .select(
            `
            *,
            users(username, full_name),
            categories(name),
            comments(rating)
          `
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (recipesError) throw recipesError;
        setUserRecipes(userRecipes || []);
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
        const { data: favoriteRecipes, error: favoritesError } = await supabase
          .from("favorites")
          .select(
            `
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

        if (favoritesError) throw favoritesError;

        const formattedRecipes: SavedRecipe[] =
          favoriteRecipes?.map((item) => {
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
}
