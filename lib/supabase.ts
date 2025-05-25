import { Database } from "@/types/supabase";
import { createBrowserClient } from "@supabase/ssr";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Initialize the Supabase client with environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if environment variables are available
if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window !== "undefined") {
    // Only throw error on client-side
    throw new Error("Missing Supabase environment variables");
  }
  // During build time, create a mock client to prevent errors
  console.warn("Supabase environment variables not available during build");
}

// Create a mock client for build time
const mockClient = {} as SupabaseClient<Database>;

// Create and export the Supabase client for client-side usage
export const supabase =
  typeof window !== "undefined" && supabaseUrl && supabaseAnonKey
    ? createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
    : supabaseUrl && supabaseAnonKey
    ? createClient<Database>(supabaseUrl, supabaseAnonKey)
    : mockClient; // Mock client for build time

// Helper function to handle database errors
export function handleError(error: Error | null): void {
  if (error) {
    console.error("Supabase error:", error);
    throw error;
  }
}

// Helper function to check if user is authenticated
export async function isAuthenticated() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return Boolean(session);
}
