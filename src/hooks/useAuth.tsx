import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface VaultData {
  personalInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    linkedinUrl?: string;
  };
  targeting?: {
    industries?: string[];
    roleTypes?: string[];
    targetRoles?: string[];
    toneOfVoice?: string;
    targetJobTitles?: string[];
    companySizes?: string[];
    mustHaves?: string;
    salaryMin?: string;
    salaryMax?: string;
  };
}

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  plan: string | null;
  credits_remaining: number | null;
  created_at: string;
  updated_at: string | null;
  display_name?: string | null;
  subscription_tier?: string | null;
  subscription_started_at?: string | null;
  monthly_usage_count?: number;
  usage_reset_at?: string | null;
  identity_vault_data?: VaultData | null;
  onboarding_completed?: boolean;
}

export type { VaultData };

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string, userEmail?: string, userName?: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("fetchProfile: Error fetching profile:", error);
        setProfile(null);
        return;
      }

      if (data) {
        setProfile(data as Profile);
        return;
      }

      // Profile doesn't exist — create it (fallback for new OAuth users)
      const { data: newProfile, error: createError } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          email: userEmail || null,
          full_name: userName || null,
          role: "client",
          plan: "free",
          credits_remaining: 0,
        })
        .select()
        .single();

      if (createError) {
        console.error("fetchProfile: Error creating profile:", createError);
        setProfile(null);
      } else {
        setProfile(newProfile as Profile);
      }
    } catch (error) {
      console.error("fetchProfile: Unexpected error:", error);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id, user.email, user.user_metadata?.full_name);
    }
  };

  useEffect(() => {
    let isInitialLoad = true;

    const handleSignInRedirect = async (userId: string) => {
      const { data: profileRow } = await supabase
        .from("profiles")
        .select("role, onboarding_completed")
        .eq("id", userId)
        .maybeSingle();

      const role = profileRow?.role ?? "client";
      const onboardingCompleted = profileRow?.onboarding_completed ?? false;
      const destination = !onboardingCompleted
        ? "/onboarding"
        : role === "admin"
        ? "/admin/dashboard"
        : "/dashboard";

      if (window.location.pathname !== destination) {
        window.location.href = destination;
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (event === "SIGNED_OUT") {
        setProfile(null);
        setLoading(false);
        isInitialLoad = false;
        return;
      }

      if (session?.user) {
        const u = session.user;
        setTimeout(() => {
          fetchProfile(u.id, u.email, u.user_metadata?.full_name);
          // Only redirect on fresh SIGNED_IN events if:
          // 1. Not the initial load (isInitialLoad = true means first event on app start)
          // 2. User is coming from login page or callback (not already on an app route)
          if (event === "SIGNED_IN" && !isInitialLoad && window.location.pathname === "/login") {
            handleSignInRedirect(u.id);
          }
          isInitialLoad = false;
        }, 0);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    // NOTE: getSession() commented out to prevent double state updates.
    // onAuthStateChange fires with INITIAL_SESSION on mount and covers
    // everything this block was doing. Uncomment only if you find a specific
    // edge case where the listener doesn't hydrate state (e.g. SSR or certain
    // OAuth flows where the listener fires late).
    //
    // supabase.auth.getSession().then(({ data: { session } }) => {
    //   setSession(session);
    //   setUser(session?.user ?? null);
    //
    //   if (session?.user) {
    //     const u = session.user;
    //     setTimeout(() => {
    //       fetchProfile(u.id, u.email, u.user_metadata?.full_name);
    //     }, 0);
    //   }
    //
    //   setLoading(false);
    // });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      window.location.href = "/login";
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);