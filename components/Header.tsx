"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Database } from "@/types/supabase";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Profile = Database["public"]["Tables"]["users"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];

export function Header() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load user profile
  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        setProfile(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error loading user profile:", error);
          return;
        }

        setProfile(data);
      } catch (error) {
        console.error("Error loading user profile:", error);
      }
    }

    loadProfile();

    // Listen for profile update events
    const handleProfileUpdate = () => {
      loadProfile();
    };

    window.addEventListener("profile-updated", handleProfileUpdate);

    // Set up real-time subscription for profile updates
    if (user) {
      const channel = supabase
        .channel("profile-changes")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "users",
            filter: `id=eq.${user.id}`,
          },
          (payload) => {
            console.log("Profile updated:", payload);
            setProfile(payload.new as Profile);
          }
        )
        .subscribe();

      return () => {
        window.removeEventListener("profile-updated", handleProfileUpdate);
        supabase.removeChannel(channel);
      };
    }

    return () => {
      window.removeEventListener("profile-updated", handleProfileUpdate);
    };
  }, [user]);

  // Load categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const { data, error } = await supabase
          .from("categories")
          .select("*")
          .order("name")
          .limit(6); // Limit to 6 categories for the dropdown

        if (error) {
          console.error("Error loading categories:", error);
          return;
        }

        setCategories(data || []);
      } catch (error) {
        console.error("Error loading categories:", error);
      }
    }

    loadCategories();
  }, []);

  const handleLogout = async () => {
    setIsLoading(true);
    await signOut();
    setIsLoading(false);
  };

  const getInitials = () => {
    if (profile?.full_name) {
      const nameParts = profile.full_name.split(" ");
      return `${nameParts[0]?.[0] || ""}${
        nameParts[1]?.[0] || ""
      }`.toUpperCase();
    }

    if (profile?.username) {
      return profile.username.slice(0, 2).toUpperCase();
    }

    return "U";
  };

  // Determine home URL based on authentication status
  const homeUrl = user ? "/dashboard" : "/";

  return (
    <header className="w-full border-b">
      <div className="container flex h-16 items-center justify-between">
        <Link href={homeUrl} className="text-2xl font-bold ps-10">
          RecipeShare
        </Link>
        <NavigationMenu>
          <NavigationMenuList>
            {user && (
              <>
                <NavigationMenuItem>
                  <NavigationMenuLink
                    asChild
                    className={cn(
                      navigationMenuTriggerStyle(),
                      (pathname === "/" || pathname === "/dashboard") &&
                        "font-bold"
                    )}
                  >
                    <Link href={homeUrl}>Home</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink
                    asChild
                    className={cn(
                      navigationMenuTriggerStyle(),
                      pathname === "/recipes" && "font-bold"
                    )}
                  >
                    <Link href="/recipes">Browse Recipes</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Categories</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                      {categories.map((category) => (
                        <li key={category.id}>
                          <NavigationMenuLink
                            asChild
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <Link href={`/categories/${category.slug}`}>
                              <div className="text-sm font-medium leading-none flex items-center gap-2">
                                {category.emoji && (
                                  <span>{category.emoji}</span>
                                )}
                                {category.name}
                              </div>
                              <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                {category.description ||
                                  `Discover ${category.name.toLowerCase()} recipes`}
                              </p>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      ))}
                      {categories.length > 0 && (
                        <li>
                          <NavigationMenuLink
                            asChild
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <Link href="/categories">
                              <div className="text-sm font-medium leading-none">
                                View All Categories
                              </div>
                              <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                Explore all recipe categories
                              </p>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      )}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink
                    asChild
                    className={cn(
                      navigationMenuTriggerStyle(),
                      pathname === "/recipes/create" && "font-bold"
                    )}
                  >
                    <Link href="/recipes/create">Create Recipe</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </>
            )}
          </NavigationMenuList>
        </NavigationMenu>
        <div className="flex items-center gap-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 outline-none">
                  <span className="hidden md:inline-block text-sm">
                    {profile?.full_name || profile?.username || user.email}
                  </span>
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={profile?.avatar_url || undefined}
                      alt={profile?.username || "User"}
                    />
                    <AvatarFallback>{getInitials()}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile/recipes">My Recipes</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile/favorites">Saved Recipes</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  disabled={isLoading}
                  className="cursor-pointer"
                >
                  {isLoading ? "Signing out..." : "Sign Out"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="outline" asChild>
                <Link href="/login">Log In</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
