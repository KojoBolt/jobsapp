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
      console.log('fetchProfile: Fetching for userId:', userId);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error('fetchProfile: Error fetching profile:', error);
        setProfile(null);
        return;
      }

      if (data) {
        console.log('fetchProfile: Profile found:', data);
        setProfile(data as Profile);
        return;
      }

      // Profile doesn't exist — create it (fallback for new OAuth users)
      console.log('fetchProfile: Profile not found, creating...');

      const { data: newProfile, error: createError } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          email: userEmail || null,
          full_name: userName || null,
          role: 'client',
          plan: 'free',
          credits_remaining: 0,
        })
        .select()
        .single();

      if (createError) {
        console.error('fetchProfile: Error creating profile:', createError);
        setProfile(null);
      } else {
        console.log('fetchProfile: Profile created successfully:', newProfile);
        setProfile(newProfile as Profile);
      }

    } catch (error) {
      console.error('fetchProfile: Unexpected error:', error);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id, user.email, user.user_metadata?.full_name);
    }
  };

  useEffect(() => {
    console.log('useAuth: Initializing...');

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('useAuth: Auth state changed:', event);

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchProfile(
            session.user.id,
            session.user.email,
            session.user.user_metadata?.full_name
          );

          // Redirect on sign in (handles both email/password and Google OAuth)
          if (event === "SIGNED_IN") {
            const { data: profile } = await supabase
              .from("profiles")
              .select("role")
              .eq("id", session.user.id)
              .maybeSingle();

            const role = profile?.role ?? "client";
            const destination = role === "admin" ? "/admin/dashboard" : "/dashboard";

            // Only redirect if not already on the destination
            if (window.location.pathname !== destination) {
              window.location.href = destination;
            }
          }

        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    // Get initial session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('useAuth: Initial session:', !!session);

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchProfile(
          session.user.id,
          session.user.email,
          session.user.user_metadata?.full_name
        );
      }

      setLoading(false);
    });

    return () => {
      console.log('useAuth: Cleaning up...');
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);

      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);