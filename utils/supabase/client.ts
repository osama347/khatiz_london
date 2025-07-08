import { createBrowserClient } from "@supabase/ssr";

// Cache for the Supabase client instance (client-side only)
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

export const createClient = () => {
  // If running on the server, always create a new client (stateless)
  if (typeof window === "undefined") {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
        global: {
          headers: {
            "X-Client-Info": "khatiz-london-app",
          },
        },
        db: {
          schema: "public",
        },
      }
    );
  }
  // On the client, use a singleton
  if (!supabaseClient) {
    supabaseClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
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
        db: {
          schema: "public",
        },
      }
    );
  }
  return supabaseClient;
};
