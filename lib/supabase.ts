import { Database } from "@/types/supabase";
import { createClient } from "@supabase/supabase-js";

// Initialize the Supabase client with environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Create and export the Supabase client for client-side usage
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

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
