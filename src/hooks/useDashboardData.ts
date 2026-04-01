import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardStats {
  // Balance
  applications_remaining: number;
  balance_status: 'Active' | 'Depleted';
  monthly_limit: number;
  plan: 'free' | 'starter' | 'pro'; 
  
  // Sent Stats
  total_sent: number;
  sent_this_week: number;
  
  // Confirmations
  total_confirmations: number;
  confirmation_rate: number;
  
  // Applications List
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

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function loadDashboard() {
      try {
        console.log('Loading dashboard data for user:', userId);

        // Fetch profile and applications in parallel
        const [profileResult, applicationsResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('plan, credits_remaining, monthly_usage_count')
            .eq('id', userId)
            .single(),
          
          supabase
            .from('applications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
        ]);

        if (profileResult.error) throw profileResult.error;
        if (applicationsResult.error) throw applicationsResult.error;

        const profile = profileResult.data;
        const allApplications = applicationsResult.data || [];

        // Calculate monthly limit based on plan
        const monthlyLimit = 
          profile.plan === 'pro' ? 200 : 
          profile.plan === 'starter' ? 50 : 
          10;

        // Calculate remaining
        const usageCount = profile.monthly_usage_count || 0;
        const remaining = Math.max(0, monthlyLimit - usageCount);

        // Calculate sent this week
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const sentThisWeek = allApplications.filter(app => 
          new Date(app.created_at) > oneWeekAgo
        ).length;

        // Calculate confirmations (submitted, interview, completed)
        const confirmedStatuses = ['submitted', 'interview', 'completed'];
        const confirmations = allApplications.filter(app => 
          confirmedStatuses.includes(app.status)
        ).length;

        const confirmationRate = allApplications.length > 0 
          ? Math.round((confirmations / allApplications.length) * 100)
          : 0;

        const dashboardData: DashboardStats = {
          applications_remaining: remaining,
          balance_status: remaining > 0 ? 'Active' : 'Depleted',
          monthly_limit: monthlyLimit,
          plan: profile.plan,
          total_sent: allApplications.length,
          sent_this_week: sentThisWeek,
          total_confirmations: confirmations,
          confirmation_rate: confirmationRate,
          applications: allApplications, 
        };

        console.log('Dashboard data loaded:', dashboardData);
        setData(dashboardData);
      } catch (err) {
        console.error('❌ Error loading dashboard:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [userId]);

  return { data, loading, error };
}