import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardStats {
  applications_remaining: number;
  balance_status: 'Active' | 'Depleted';
  monthly_limit: number;
  plan: 'free' | 'starter' | 'pro';
  total_sent: number;
  sent_this_week: number;
  total_confirmations: number;
  confirmation_rate: number;
  applications: Application[];
}

export interface Application {
  id: string;
  company_name: string;
  job_title: string;
  status: 'queued' | 'drafting' | 'pending_review' | 'approved' | 'submitted' | 'interview' | 'completed' | 'failed';
  created_at: string;
  job_url: string;
  resume_id: string | null;
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
      const [profileResult, applicationsResult] = await Promise.all([
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
      ]);

      if (profileResult.error) throw profileResult.error;
      if (applicationsResult.error) throw applicationsResult.error;

      const profile = profileResult.data;
      const allApplications = applicationsResult.data || [];

      // Use credits_remaining directly from the database
      const remaining = profile.credits_remaining ?? 0;

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const sentThisWeek = allApplications.filter(
        (app) => new Date(app.created_at) > oneWeekAgo
      ).length;

      const confirmedStatuses = ['submitted', 'interview', 'completed'];
      const confirmations = allApplications.filter((app) =>
        confirmedStatuses.includes(app.status)
      ).length;

      const confirmationRate =
        allApplications.length > 0
          ? Math.round((confirmations / allApplications.length) * 100)
          : 0;

      const dashboardData: DashboardStats = {
        applications_remaining: remaining,
        balance_status: remaining > 0 ? 'Active' : 'Depleted',
        monthly_limit: remaining,
        plan: profile.plan,
        total_sent: allApplications.length,
        sent_this_week: sentThisWeek,
        total_confirmations: confirmations,
        confirmation_rate: confirmationRate,
        applications: allApplications,
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