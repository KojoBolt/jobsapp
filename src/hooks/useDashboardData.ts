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
}

export function useDashboardData(userId: string | undefined) {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadDashboard = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
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

        // The most recent running campaign — used to scope the stat cards.
        supabase
          .from('campaigns')
          .select('id')
          .eq('user_id', userId)
          .eq('status', 'running')
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

  return { data, loading, error, refetch: loadDashboard };
}