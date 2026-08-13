import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardStats {
  applications_remaining: number;
  balance_status: 'Active' | 'Depleted';
  monthly_limit: number;
  plan: 'free' | 'starter' | 'pro';
  total_sent: number;          // scoped to the active campaign
  sent_this_week: number;      // scoped to the active campaign
  total_confirmations: number; // scoped to the active campaign
  confirmation_rate: number;   // scoped to the active campaign
  active_campaign_id: string | null;
  lifetime_sent: number;
  applications: Application[]; // full lifetime history (for the feed)
}

export interface Application {
  id: string;
  company_name: string;
  job_title: string;
  status: 'queued' | 'drafting' | 'pending_review' | 'approved' | 'submitted' | 'interview' | 'completed' | 'failed';
  created_at: string;
  job_url: string;
  resume_id: string | null;
  campaign_id: string | null;
  location?: string;
  match_score?: number;
  /** Scraped posting text, truncated to ~800 chars by _shared/sourcing.ts. */
  job_description?: string;
  /** Which job board it came from — adzuna, remotive, jsearch, themuse, … */
  source?: string;
  /**
   * Employer logo, only ever set when a source actually supplied one (or, for
   * Greenhouse, when we hold a hand-checked domain). Null means "unknown" and
   * the UI shows initials — it must never be back-filled from a guessed
   * domain, which rendered parked-page favicons beside real employers.
   */
  company_logo?: string | null;
}

export function useDashboardData(userId: string | undefined) {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // `silent` skips the loading flag so a realtime refresh doesn't tear the page
  // down to a spinner — Dashboard renders a full-page loader whenever it's set.
  const loadDashboard = async (opts?: { silent?: boolean }) => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      if (!opts?.silent) setLoading(true);
      const [profileResult, applicationsResult, campaignResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('plan, credits_remaining')
          .eq('id', userId)
          .single(),

        supabase
          .from('applications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),

        // The most recent campaign, whatever state it's in — used to scope the
        // stat cards.
        //
        // This used to require status = 'running', which silently zeroed every
        // campaign-scoped stat the moment process-batch flipped the campaign to
        // 'completed' or 'exhausted'. Admin confirmations land *after* that
        // point, so the numbers they feed could never appear.
        supabase
          .from('campaigns')
          .select('id, status')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (profileResult.error) throw profileResult.error;
      if (applicationsResult.error) throw applicationsResult.error;

      const profile = profileResult.data;
      const rawApplications = applicationsResult.data || [];
      const activeCampaignId = campaignResult.data?.id ?? null;

      // Normalize database properties to ensure UI-compatibility.
      const allApplications: Application[] = rawApplications.map((app: any) => ({
        id: app.id,
        company_name: app.company_name || app.company || 'Unknown Company',
        job_title: app.job_title || app.title || 'Unknown Role',
        job_url: app.job_url || app.url || '',
        status: app.status === 'processing' ? 'drafting' : (app.status || 'queued'),
        created_at: app.created_at,
        resume_id: app.resume_id || null,
        campaign_id: app.campaign_id || null,
        location: app.location || '',
        match_score: app.match_score || 0,
        job_description: app.job_description || '',
        source: app.source || '',
        // Kept null rather than '' — absence has to stay distinguishable.
        company_logo: app.company_logo || null,
      }));

      // ── Stat cards: scope to the active campaign only ──────────────────
      const campaignApps = activeCampaignId
        ? allApplications.filter((a) => a.campaign_id === activeCampaignId)
        : [];

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const sentThisWeek = campaignApps.filter(
        (app) => new Date(app.created_at) > oneWeekAgo
      ).length;

      const confirmedStatuses = ['submitted', 'interview', 'completed'];
      const confirmations = campaignApps.filter((app) =>
        confirmedStatuses.includes(app.status)
      ).length;

      const confirmationRate =
        campaignApps.length > 0
          ? Math.round((confirmations / campaignApps.length) * 100)
          : 0;

      const remaining = profile.credits_remaining ?? 0;

      const dashboardData: DashboardStats = {
        applications_remaining: remaining,
        balance_status: remaining > 0 ? 'Active' : 'Depleted',
        monthly_limit: remaining,
        plan: profile.plan || 'free',
        total_sent: campaignApps.length,          // per active campaign
        sent_this_week: sentThisWeek,             // per active campaign
        total_confirmations: confirmations,       // per active campaign
        confirmation_rate: confirmationRate,      // per active campaign
        active_campaign_id: activeCampaignId,
        lifetime_sent: allApplications.length,
        applications: allApplications,            // full history for the feed
      };

      setData(dashboardData);
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [userId]);

  // Keep the dashboard live. Without this the page only ever showed whatever
  // was true at mount, so an admin approving or confirming a submission never
  // appeared until the user happened to reload.
  useEffect(() => {
    if (!userId) return;

    // Coalesce bursts — a batch run touches many rows in quick succession, and
    // each one would otherwise trigger its own full reload.
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refreshSoon = () => {
      clearTimeout(timer);
      timer = setTimeout(() => loadDashboard({ silent: true }), 400);
    };

    const channel = supabase
      .channel(`dashboard_${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'applications', filter: `user_id=eq.${userId}` },
        refreshSoon,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'campaigns', filter: `user_id=eq.${userId}` },
        refreshSoon,
      )
      .subscribe();

    return () => {
      clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { data, loading, error, refetch: loadDashboard };
}