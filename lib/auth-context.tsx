"use client";

import { supabase } from "@/lib/supabase";
import { Session, User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";

interface AuthContextProps {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signUp: (
    email: string,
    password: string,
    username: string,
    fullName?: string
  ) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// Create the auth context
const AuthContext = createContext<AuthContextProps | undefined>(undefined);

// Create a provider component for the auth context
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Initialize the auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get the current session
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user || null);

        // Set up a listener for changes to auth state
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, newSession) => {
          console.log("Auth state changed:", event, newSession?.user?.email);
          setSession(newSession);
          setUser(newSession?.user || null);
          router.refresh(); // Refresh the page to update server-side components
          setIsLoading(false);
        });

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [router]);

  // Sign up function
  const signUp = async (
    email: string,
    password: string,
    username: string,
    fullName?: string
  ) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            username,
            full_name: fullName || null,
          },
        },
      });

      if (error) {
        toast.error(error.message);
        throw error;
      }

      // Create a user record in the users table
      if (data.user) {
        const { error: profileError } = await supabase.from("users").insert({
          id: data.user.id,
          email,
          username,
          full_name: fullName || null,
        });

        if (profileError) {
          toast.error("Error creating user profile");
          throw profileError;
        }

        toast.success("Account created successfully!");
        router.push("/login");
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unexpected error occurred");
        console.error(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        throw error;
      }

      if (data.session) {
        // Update local state immediately
        setSession(data.session);
        setUser(data.session.user);

        toast.success("Signed in successfully!");

        // Wait a moment for cookies to be set and state to propagate
        await new Promise((resolve) => setTimeout(resolve, 200));

        // Force a page refresh to ensure middleware recognizes the session
        window.location.href = "/dashboard";
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unexpected error occurred");
        console.error(error);
      }
      throw error; // Re-throw to allow login page to handle it
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();

      if (error) {
        toast.error(error.message);
        throw error;
      }

      toast.success("Signed out successfully");

      // Clear states immediately
      setUser(null);
      setSession(null);

      // Wait a moment for cookies to be cleared and state to propagate
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Force a page refresh to ensure middleware recognizes the logout
      window.location.href = "/";
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unexpected error occurred");
        console.error(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      // Trigger a profile refresh by emitting a custom event
      window.dispatchEvent(new CustomEvent("profile-updated"));
    }
  };

  const value = {
    user,
    session,
    isLoading,
    signUp,
    signIn,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
