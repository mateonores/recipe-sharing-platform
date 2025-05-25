"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type UserProfile = Database["public"]["Tables"]["users"]["Row"];
type Recipe = Database["public"]["Tables"]["recipes"]["Row"] & {
  users?: { username: string; full_name: string | null };
  categories?: { name: string } | null;
  comments?: { rating: number | null }[];
};

export default function ProfilePage() {
  const { user, isLoading: authLoading, refreshProfile } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "my-recipes" | "saved" | "settings"
  >("my-recipes");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userRecipes, setUserRecipes] = useState<Recipe[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

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

        const formattedRecipes: Recipe[] =
          favoriteRecipes?.map((item) => {
            const recipe = item.recipes as unknown as Recipe;
            return recipe;
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

  // Handle password change
  const handleChangePassword = async (formData: FormData) => {
    if (!user) return;

    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long");
      return;
    }

    setIsChangingPassword(true);
    try {
      // First, verify the current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email || "",
        password: currentPassword,
      });

      if (signInError) {
        toast.error("Current password is incorrect");
        return;
      }

      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        toast.error(updateError.message);
        return;
      }

      toast.success("Password updated successfully!");

      // Reset the form
      const form = document.getElementById("password-form") as HTMLFormElement;
      if (form) {
        form.reset();
      }
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error("Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

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

  if (authLoading || isLoading) {
    return (
      <div className="container py-12 px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !userProfile) {
    return (
      <div className="container py-12 px-4 md:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Profile</h1>
            <p className="text-gray-600 mt-1">
              Manage your account and recipes
            </p>
          </div>
          <Button asChild>
            <Link href="/recipes/create">Create New Recipe</Link>
          </Button>
        </div>

        {/* Profile Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as typeof activeTab)}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="my-recipes" className="cursor-pointer">
              My Recipes
            </TabsTrigger>
            <TabsTrigger value="saved" className="cursor-pointer">
              Saved Recipes
            </TabsTrigger>
            <TabsTrigger value="settings" className="cursor-pointer">
              Settings
            </TabsTrigger>
          </TabsList>

          {/* My Recipes Tab */}
          <TabsContent value="my-recipes" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>My Recipes ({userRecipes.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {userRecipes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {userRecipes.map((recipe) => (
                      <div
                        key={recipe.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        {recipe.image_url && (
                          <div className="relative aspect-video mb-3 overflow-hidden rounded">
                            <Image
                              src={recipe.image_url}
                              alt={recipe.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <h3 className="font-semibold mb-2">{recipe.title}</h3>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {recipe.description || "No description"}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-sm">
                            <span className="text-yellow-400">★</span>
                            <span>{getAverageRating(recipe)}</span>
                            <span className="text-gray-500">
                              ({getRatingsCount(recipe)})
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/recipes/${recipe.id}`}>View</Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/recipes/${recipe.id}/edit`}>
                                Edit
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">
                      You haven&apos;t created any recipes yet.
                    </p>
                    <Button asChild>
                      <Link href="/recipes/create">
                        Create Your First Recipe
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Saved Recipes Tab */}
          <TabsContent value="saved" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Saved Recipes ({savedRecipes.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {savedRecipes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {savedRecipes.map((recipe) => (
                      <div
                        key={recipe.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        {recipe.image_url && (
                          <div className="relative aspect-video mb-3 overflow-hidden rounded">
                            <Image
                              src={recipe.image_url}
                              alt={recipe.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <h3 className="font-semibold mb-2">{recipe.title}</h3>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {recipe.description || "No description"}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-sm">
                            <span className="text-yellow-400">★</span>
                            <span>{getAverageRating(recipe)}</span>
                            <span className="text-gray-500">
                              ({getRatingsCount(recipe)})
                            </span>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/recipes/${recipe.id}`}>
                              View Recipe
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">
                      You haven&apos;t saved any recipes yet.
                    </p>
                    <Button asChild>
                      <Link href="/recipes">Browse Recipes</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Photo */}
                <div className="flex items-center gap-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage
                      src={userProfile.avatar_url || ""}
                      alt="Profile"
                    />
                    <AvatarFallback className="text-lg">
                      {userProfile.username?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingPhoto}
                    >
                      {isUploadingPhoto ? "Uploading..." : "Change Photo"}
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      JPG, PNG or GIF. Max size 5MB.
                    </p>
                  </div>
                </div>

                {/* Profile Form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    handleUpdateProfile(formData);
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        name="username"
                        defaultValue={userProfile.username || ""}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        name="full_name"
                        defaultValue={userProfile.full_name || ""}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={userProfile.email || ""}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Email cannot be changed from here.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      defaultValue={userProfile.bio || ""}
                      placeholder="Tell us about yourself..."
                      rows={3}
                    />
                  </div>
                  <Button type="submit" disabled={isUpdating}>
                    {isUpdating ? "Saving..." : "Save Changes"}
                  </Button>
                </form>

                {/* Password Change Section */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Change Password
                  </h3>
                  <form
                    id="password-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      handleChangePassword(formData);
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        name="currentPassword"
                        type="password"
                        required
                        placeholder="Enter your current password"
                      />
                    </div>
                    <div>
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        required
                        placeholder="Enter your new password"
                        minLength={6}
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Password must be at least 6 characters long.
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">
                        Confirm New Password
                      </Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        required
                        placeholder="Confirm your new password"
                        minLength={6}
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={isChangingPassword}
                      variant="outline"
                    >
                      {isChangingPassword
                        ? "Changing Password..."
                        : "Change Password"}
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
