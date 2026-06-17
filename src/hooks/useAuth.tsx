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
    // Looks up role + onboarding, then redirects. Defined outside the auth
    // callback and only CALLED from a deferred timeout (never awaited inside it).
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

    // IMPORTANT: this callback is SYNCHRONOUS and never awaits Supabase calls
    // inside itself. Awaiting Supabase calls here deadlocks the auth lock and
    // makes signOut() (and other auth calls) hang until a manual page refresh.
    // Any Supabase work is pushed out via setTimeout(0) so the callback returns
    // immediately and releases the lock.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (event === "SIGNED_OUT") {
        setProfile(null);
        setLoading(false);
        return;
      }

      if (session?.user) {
        const u = session.user;
        setTimeout(() => {
          fetchProfile(u.id, u.email, u.user_metadata?.full_name);
          if (event === "SIGNED_IN") {
            handleSignInRedirect(u.id);
          }
        }, 0);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    // Initial session on mount — also defers the profile fetch.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const u = session.user;
        setTimeout(() => {
          fetchProfile(u.id, u.email, u.user_metadata?.full_name);
        }, 0);
      }

      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      // 'local' clears this device's session without waiting on a server
      // round-trip, so it's instant and can't hang on a slow network.
      await supabase.auth.signOut({ scope: "local" });
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      // Full page navigation = clean teardown of all state. Immediate.
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