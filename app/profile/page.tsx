"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

// Mock user data for display purposes
const currentUser = {
  username: "johndoe",
  full_name: "John Doe",
  bio: "Passionate home cook with a love for Mediterranean and Asian cuisines. Sharing my favorite recipes and culinary experiments.",
  avatar_url: "/placeholder-avatar.jpg",
};

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<
    "my-recipes" | "saved" | "settings"
  >("my-recipes");

  return (
    <div className="container py-12 px-4 md:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-center gap-8 mb-10">
          <Avatar className="w-32 h-32">
            <AvatarImage
              src={currentUser.avatar_url}
              alt={currentUser.username}
            />
            <AvatarFallback>
              {currentUser.full_name
                ? `${currentUser.full_name.split(" ")[0][0]}${
                    currentUser.full_name.split(" ")[1]?.[0] || ""
                  }`
                : currentUser.username.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-center md:text-left">
            {currentUser.full_name && (
              <h1 className="text-3xl font-bold mb-1">
                {currentUser.full_name}
              </h1>
            )}
            <div
              className={`${
                currentUser.full_name
                  ? "text-lg text-gray-600 mb-3"
                  : "text-3xl font-bold mb-2"
              }`}
            >
              @{currentUser.username}
            </div>
            <p className="text-gray-500 max-w-md mb-4">{currentUser.bio}</p>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              <div className="bg-slate-100 px-3 py-1 rounded-full text-sm">
                <span className="font-medium">12</span> Recipes
              </div>
              <div className="bg-slate-100 px-3 py-1 rounded-full text-sm">
                <span className="font-medium">48</span> Followers
              </div>
              <div className="bg-slate-100 px-3 py-1 rounded-full text-sm">
                <span className="font-medium">36</span> Following
              </div>
            </div>
          </div>
          <Button size="sm">Edit Profile</Button>
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
                        src={recipe.image}
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
                            {recipe.category}
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
                          <span className="text-sm">{recipe.rating}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-4">
                        <span className="text-xs text-gray-500">
                          {recipe.date}
                        </span>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/recipes/${recipe.id}/edit`}>
                              Edit
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm">
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
                        src={recipe.image}
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
                          by {recipe.author}
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
                          <span className="text-sm">{recipe.rating}</span>
                        </div>
                        <Button variant="outline" size="sm">
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
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Profile Photo</label>
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage
                      src={currentUser.avatar_url}
                      alt={currentUser.username}
                    />
                    <AvatarFallback>
                      {currentUser.full_name
                        ? `${currentUser.full_name.split(" ")[0][0]}${
                            currentUser.full_name.split(" ")[1]?.[0] || ""
                          }`
                        : currentUser.username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Button variant="outline" size="sm">
                    Change Photo
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Username</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md"
                  defaultValue={currentUser.username}
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
                  className="w-full p-2 border rounded-md"
                  defaultValue={currentUser.full_name}
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
                  className="w-full p-2 border rounded-md"
                  defaultValue="john@example.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Bio</label>
                <textarea
                  className="w-full p-2 border rounded-md min-h-24"
                  defaultValue={currentUser.bio}
                ></textarea>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <input
                  type="password"
                  className="w-full p-2 border rounded-md"
                  placeholder="••••••••••"
                />
                <p className="text-xs text-gray-500">
                  Leave blank to keep your current password
                </p>
              </div>

              <div className="pt-4">
                <Button>Save Changes</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const userRecipes = [
  {
    id: "1",
    title: "Homemade Margherita Pizza",
    category: "Italian",
    image: "/recipes/pizza.jpg",
    rating: 4.8,
    date: "April 12, 2023",
  },
  {
    id: "2",
    title: "Chicken Tikka Masala",
    category: "Indian",
    image: "/recipes/tikka.jpg",
    rating: 4.6,
    date: "March 3, 2023",
  },
  {
    id: "3",
    title: "Chocolate Chip Cookies",
    category: "Dessert",
    image: "/recipes/cookies.jpg",
    rating: 4.9,
    date: "January 15, 2023",
  },
];

const savedRecipes = [
  {
    id: "4",
    title: "Vegetable Stir Fry with Tofu",
    author: "Chef Mei",
    image: "/recipes/stir-fry.jpg",
    rating: 4.2,
  },
  {
    id: "5",
    title: "Classic Beef Burger",
    author: "Chef John",
    image: "/recipes/burger.jpg",
    rating: 4.7,
  },
];
