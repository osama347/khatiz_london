import { createBrowserClient } from "@supabase/ssr";

// Cache for the Supabase client instance
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

export const createClient = () => {
  if (!supabaseClient) {
    supabaseClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        // Performance optimizations
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
        global: {
          headers: {
            "X-Client-Info": "khatiz-london-app",
          },
        },
        // Connection pooling
        db: {
          schema: "public",
        },
      }
    );
  }

  return supabaseClient;
};
