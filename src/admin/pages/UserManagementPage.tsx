import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ChevronDown, ChevronUp, Shield, User, FileText, Users2, Crown,
  Coins, PieChart, LineChart as LineIcon, BarChart3, Inbox, AlertTriangle, Plus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/admin/toast/ToastContext";
import { format, formatDistanceToNow, subMonths, startOfMonth } from "date-fns";
import {
  T, Panel, PanelHeader, Th, Avatar, StatTile, SearchInput, Pill, PillMenu,
  PrimaryButton, GhostButton, IconButton, LegendRow, Pagination, EmptyState,
} from "@/admin/ui/system";
import {
  PipelineGauge, TrendChart, TrendKey, RankedBar, useRamp, buildTrend,
  GRAIN_OPTIONS, type GaugeBand, type Grain,
} from "@/admin/ui/charts";
import { useRegisterExport } from "@/admin/context/AdminActionsContext";

/** Mirrors the user_plan / user_role enums. */
type Plan = "free" | "starter" | "pro";
type Role = "client" | "admin";

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  plan: string | null;
  credits_remaining: number;
  monthly_usage_count: number;
  created_at: string;
  total_applications: number;
}

const ITEMS_PER_PAGE = 10;

/** "free" is the DB value; "Basic" is what the product calls it. */
const PLAN_LABEL: Record<string, string> = {
  free: "Basic",
  starter: "Starter",
  pro: "Pro",
};

const csvCell = (v: unknown) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const UserManagementPage = (): JSX.Element => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Seeded from ?q= so the header search can land here pre-filtered.
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const appliedQ = useRef<string | null>(searchParams.get("q"));
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ plan: Plan; credits: number; role: Role }>({
    plan: "free",
    credits: 0,
    role: "client",
  });
  const [saving, setSaving] = useState(false);
  const [grain, setGrain] = useState<Grain>("monthly");
  const [sendingSummaryId, setSendingSummaryId] = useState<string | null>(null);
  const { pushToast } = useToast();
  const { ramp } = useRamp();

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * ?q= is a one-shot seed, not a source of truth. It's applied once per
   * distinct value and then stripped from the URL — otherwise it lingers and
   * the effect keeps snapping the field back to it while you type.
   */
  useEffect(() => {
    const q = searchParams.get("q");
    if (q === null || appliedQ.current === q) return;

    appliedQ.current = q;
    setSearch(q);
    setCurrentPage(1);

    const next = new URLSearchParams(searchParams);
    next.delete("q");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setLoadError(null);

      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[UserManagement] profiles query failed:", error);
        setLoadError(error.message || "Failed to load users");
        pushToast({ variant: "error", title: "Error", message: error.message || "Failed to load users" });
        return;
      }

      const { data: appCounts } = await supabase.from("applications").select("user_id");

      const countMap = new Map<string, number>();
      (appCounts || []).forEach((a) => {
        countMap.set(a.user_id, (countMap.get(a.user_id) || 0) + 1);
      });

      const enriched: UserProfile[] = (profiles || []).map((p) => ({
        id: p.id,
        full_name: p.full_name || "No Name",
        email: p.email || "No Email",
        role: p.role || "client",
        plan: p.plan || "free",
        credits_remaining: p.credits_remaining || 0,
        monthly_usage_count: p.monthly_usage_count || 0,
        created_at: p.created_at,
        total_applications: countMap.get(p.id) || 0,
      }));

      setUsers(enriched);
    } catch (err: any) {
      console.error("[UserManagement] unexpected error:", err);
      setLoadError(err?.message || "Unexpected error");
      pushToast({ variant: "error", title: "Error", message: "Unexpected error" });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: UserProfile) => {
    setExpandedUser(user.id);
    setEditingUser(user.id);
    setEditValues({
      plan: (user.plan as Plan) || "free",
      credits: user.credits_remaining,
      role: (user.role as Role) || "client",
    });
  };

  const handleSave = async (userId: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          plan: editValues.plan,
          credits_remaining: editValues.credits,
          role: editValues.role,
        })
        .eq("id", userId);

      if (error) {
        pushToast({ variant: "error", title: "Error", message: `Failed to update: ${error.message}` });
        return;
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, plan: editValues.plan, credits_remaining: editValues.credits, role: editValues.role }
            : u,
        ),
      );

      pushToast({ variant: "success", title: "Updated", message: "User updated successfully!" });
      setEditingUser(null);
    } catch (err: any) {
      pushToast({ variant: "error", title: "Error", message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleAddCredits = async (userId: string, amount: number) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    const newCredits = user.credits_remaining + amount;
    const { error } = await supabase
      .from("profiles")
      .update({ credits_remaining: newCredits })
      .eq("id", userId);

    if (error) {
      pushToast({ variant: "error", title: "Error", message: "Failed to add credits" });
      return;
    }

    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, credits_remaining: newCredits } : u)));
    pushToast({ variant: "success", title: "Credits added", message: `Added ${amount} credits` });
  };

  // Generate + send the application-summary PDF (in-app + email) for one user.
  const handleSendSummary = async (user: UserProfile) => {
    if (user.total_applications === 0) {
      pushToast({
        variant: "error",
        title: "No applications",
        message: "This user has no applications to summarize yet.",
      });
      return;
    }
    setSendingSummaryId(user.id);
    try {
      const { data, error } = await supabase.functions.invoke("generate-application-summary", {
        body: { userId: user.id },
      });
      if (error) {
        const body = await (error as any).context?.json?.().catch(() => null);
        pushToast({ variant: "error", title: "Failed", message: body?.error || "Could not generate summary" });
        return;
      }
      pushToast({
        variant: "success",
        title: "Summary generated",
        message: data.emailed
          ? `${data.job_count} applications · emailed + in-app`
          : `${data.job_count} apps · in-app only (${data.email_error || "no reason returned"})`,
      });
    } catch (err: any) {
      pushToast({ variant: "error", title: "Error", message: err?.message || "Unexpected error" });
    } finally {
      setSendingSummaryId(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        (u.full_name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q),
    );
  }, [users, search]);

  // Typeahead reads the already-loaded list — no extra round trip, so the
  // suggestions appear as fast as you type.
  const suggestions = useMemo(
    () =>
      search.trim()
        ? filtered.slice(0, 6).map((u) => ({
            id: u.id,
            title: u.full_name || "No name",
            subtitle: u.email || undefined,
          }))
        : [],
    [filtered, search],
  );

  /** Picking a suggestion narrows to that user and opens their details. */
  const selectSuggestion = (id: string) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    setSearch(user.full_name || user.email || "");
    setCurrentPage(1);
    setExpandedUser(id);
  };

  /* ── Derived metrics + chart series ───────────────────────────────────── */
  const m = useMemo(() => {
    const paid = users.filter((u) => u.plan === "starter" || u.plan === "pro").length;
    const admins = users.filter((u) => u.role === "admin").length;
    const credits = users.reduce((s, u) => s + u.credits_remaining, 0);

    // Plan mix for the gauge.
    const byPlan = new Map<string, number>();
    users.forEach((u) => byPlan.set(u.plan || "free", (byPlan.get(u.plan || "free") || 0) + 1));
    const bands: GaugeBand[] = [...byPlan.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name: PLAN_LABEL[name] || name, value }));

    // Signups bucketed at the selected granularity.
    const {
      data: trend, target, caption: trendCaption,
    } = buildTrend(users, (u) => new Date(u.created_at), grain);

    // Most active users by application volume.
    const topUsers = [...users]
      .filter((u) => u.total_applications > 0)
      .sort((a, b) => b.total_applications - a.total_applications)
      .slice(0, 3)
      .map((u) => {
        const n = u.full_name || "Unknown";
        return { name: n.length > 12 ? `${n.slice(0, 11)}…` : n, value: u.total_applications };
      });

    return { paid, admins, credits, bands, trend, target, trendCaption, topUsers };
  }, [users, grain]);

  const exportCsv = useCallback(() => {
    const header = ["Name", "Email", "Role", "Plan", "Credits", "Applications", "Joined"];
    const rows = filtered.map((u) => [
      u.full_name, u.email, u.role, PLAN_LABEL[u.plan || "free"] || u.plan,
      u.credits_remaining, u.total_applications,
      format(new Date(u.created_at), "yyyy-MM-dd"),
    ]);
    const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered]);

  useRegisterExport(exportCsv);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const field = `rounded-lg border ${T.hairline} bg-white px-2.5 py-1.5 text-[12.5px] ${T.ink}
                 focus:outline-none focus:ring-2 focus:ring-[#2a78d6]/30 dark:bg-[#1A1A19]`;
  const microLabel = `mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] ${T.muted}`;

  /** Expanded detail / edit panel — shared by the desktop table and mobile cards. */
  const renderDetails = (user: UserProfile) => {
    const isEditing = editingUser === user.id;

    return (
      <div className={`border-t ${T.hairline} bg-[#FAFAF8] px-4 py-4 dark:bg-white/[0.02] sm:px-5`}>
        {isEditing ? (
          <div className="grid gap-3 sm:flex sm:flex-wrap sm:items-end">
            <div>
              <label className={microLabel}>Plan</label>
              <select
                value={editValues.plan}
                onChange={(e) => setEditValues((p) => ({ ...p, plan: e.target.value as Plan }))}
                className={`${field} w-full sm:w-auto`}
              >
                <option value="free">Basic</option>
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
              </select>
            </div>
            <div>
              <label className={microLabel}>Credits</label>
              <input
                type="number"
                value={editValues.credits}
                onChange={(e) => setEditValues((p) => ({ ...p, credits: Number(e.target.value) }))}
                className={`${field} w-full tabular-nums sm:w-24`}
              />
            </div>
            <div>
              <label className={microLabel}>Role</label>
              <select
                value={editValues.role}
                onChange={(e) => setEditValues((p) => ({ ...p, role: e.target.value as Role }))}
                className={`${field} w-full sm:w-auto`}
              >
                <option value="client">Client</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex gap-2">
              <PrimaryButton onClick={() => !saving && handleSave(user.id)}>
                {saving ? "Saving…" : "Save changes"}
              </PrimaryButton>
              <GhostButton onClick={() => setEditingUser(null)}>Cancel</GhostButton>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className={microLabel}>Monthly usage</p>
              <p className={`text-[13px] font-semibold ${T.ink}`}>
                {user.monthly_usage_count}
                <span className={`ml-1 text-[11px] font-normal ${T.muted}`}>this month</span>
              </p>
            </div>
            <div>
              <p className={microLabel}>Total applications</p>
              <p className={`text-[13px] font-semibold ${T.ink}`}>{user.total_applications}</p>
            </div>
            <div>
              <p className={microLabel}>User ID</p>
              <p className={`font-mono text-[11px] ${T.ink2}`}>{user.id.slice(0, 18)}…</p>
            </div>
            <div className="flex flex-wrap items-start gap-2">
              <PrimaryButton onClick={() => handleEdit(user)}>Edit user</PrimaryButton>
              <GhostButton
                onClick={() =>
                  sendingSummaryId !== user.id &&
                  user.total_applications > 0 &&
                  handleSendSummary(user)
                }
              >
                <FileText size={13} />
                {sendingSummaryId === user.id ? "Generating…" : "Send summary"}
              </GhostButton>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={`text-[20px] font-bold tracking-[-0.01em] ${T.ink}`}>User Management</h1>
          <p className={`text-[12px] ${T.muted}`}>
            {loading
              ? "Loading…"
              : `${filtered.length} user${filtered.length !== 1 ? "s" : ""}${
                  search ? ` of ${users.length}` : ""
                }`}
          </p>
        </div>
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setCurrentPage(1); }}
          placeholder="Search by name or email…"
          suggestions={suggestions}
          onSelectSuggestion={selectSuggestion}
        />
      </div>

      {/* ── Stat row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile icon={Users2} label="Total Users" value={users.length}
                  delta={0} caption="registered" loading={loading} />
        <StatTile icon={Crown} label="Paid Users" value={m.paid}
                  note={users.length ? `${Math.round((m.paid / users.length) * 100)}%` : undefined}
                  delta={0} caption="starter or pro" loading={loading} />
        <StatTile icon={Shield} label="Admins" value={m.admins}
                  delta={0} caption="with elevated access" loading={loading} />
        <StatTile icon={Coins} label="Credits Outstanding" value={m.credits.toLocaleString()}
                  delta={0} caption="across all accounts" loading={loading} />
      </div>

      {/* ── Charts ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel>
          <PanelHeader icon={PieChart} title="Plan Mix" right={<IconButton label="Open plan mix" />} />
          <div className="px-5 pb-4">
            {users.length > 0 ? (
              <>
                <PipelineGauge bands={m.bands} total={users.length} caption="Users" />
                <div className={`mt-2 divide-y ${T.divide}`}>
                  {m.bands.map((b, i) => (
                    <LegendRow
                      key={b.name}
                      color={ramp[i % ramp.length]}
                      name={b.name}
                      sub={`${Math.round((b.value / users.length) * 100)}% of users`}
                      value={String(b.value)}
                    />
                  ))}
                </div>
              </>
            ) : (
              <p className={`py-14 text-center text-[12px] ${T.muted}`}>
                {loading ? "Loading…" : "No users yet"}
              </p>
            )}
          </div>
        </Panel>

        <Panel className="lg:col-span-2">
          <PanelHeader
            icon={LineIcon}
            title="Signups Over Time"
            right={
              <>
                <PillMenu
                  value={grain}
                  onChange={(v) => setGrain(v)}
                  heading="Group by"
                  options={GRAIN_OPTIONS}
                />
                <IconButton label="Open signups" />
              </>
            }
          />
          <div className="px-5 pb-4">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className={`text-[24px] font-bold leading-none tracking-[-0.02em] ${T.ink}`}>
                  {m.trend.reduce((s, t) => s + t.value, 0)}
                </p>
                <p className={`mt-1 text-[11px] ${T.muted}`}>
                  Joined · {m.trendCaption.toLowerCase()}
                </p>
              </div>
              <TrendKey />
            </div>
            <TrendChart data={m.trend} target={m.target} />
          </div>
        </Panel>
      </div>

      {m.topUsers.length > 0 && (
        <Panel>
          <PanelHeader icon={BarChart3} title="Most Active Users" right={<Pill>All time</Pill>} />
          <div className="px-5 pb-4">
            <RankedBar data={m.topUsers} />
          </div>
        </Panel>
      )}

      {/* ── Mobile: one card per user ───────────────────────────────────── */}
      <div className="space-y-3 md:hidden">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <Panel key={i} className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 animate-pulse rounded-full bg-[#EFEFEC] dark:bg-white/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-32 animate-pulse rounded bg-[#EFEFEC] dark:bg-white/10" />
                  <div className="h-3 w-44 animate-pulse rounded bg-[#EFEFEC] dark:bg-white/10" />
                </div>
              </div>
            </Panel>
          ))
        ) : paginated.length > 0 ? (
          paginated.map((user) => {
            const isOpen = expandedUser === user.id;
            const isAdmin = user.role === "admin";

            return (
              <Panel key={user.id} className="overflow-hidden">
                <div className="flex items-start gap-3 p-4">
                  <Avatar name={user.full_name || "?"} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-[15px] font-bold ${T.ink}`}>{user.full_name}</p>
                    <p className={`truncate text-[12.5px] ${T.muted}`}>{user.email}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-medium capitalize ${T.ink2}`}>
                        {isAdmin
                          ? <Shield size={10} className="text-[#D03B3B]" />
                          : <User size={10} className={T.muted} />}
                        {user.role}
                      </span>
                      <span className={`rounded-md border ${T.hairline} px-1.5 py-0.5 text-[10.5px] font-medium ${T.ink}`}>
                        {PLAN_LABEL[user.plan || "free"] || user.plan}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Credits and applications — the two numbers that get acted on. */}
                <div className={`grid grid-cols-2 border-t ${T.hairline}`}>
                  <div className={`border-r ${T.hairline} p-4`}>
                    <p className={`text-[11px] ${T.muted}`}>Credits</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className={`text-[18px] font-bold leading-none tabular-nums ${T.ink}`}>
                        {user.credits_remaining}
                      </span>
                      <button
                        onClick={() => handleAddCredits(user.id, 200)}
                        className={`inline-flex items-center gap-0.5 rounded-md border ${T.hairline} px-1.5 py-0.5
                                    text-[10.5px] font-semibold ${T.ink2} hover:bg-[#F4F4F2] dark:hover:bg-white/5`}
                      >
                        <Plus size={9} strokeWidth={3} />200
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className={`text-[11px] ${T.muted}`}>Applications</p>
                    <p className={`mt-0.5 text-[18px] font-bold leading-none tabular-nums ${T.ink}`}>
                      {user.total_applications}
                    </p>
                  </div>
                </div>

                <div className={`flex items-center justify-between gap-3 border-t ${T.hairline} px-4 py-3`}>
                  <span className={`text-[11.5px] ${T.muted}`}>
                    Joined {format(new Date(user.created_at), "d MMM yyyy")}
                  </span>
                  <div className="flex items-center gap-2">
                    <GhostButton
                      onClick={() => {
                        setExpandedUser(isOpen ? null : user.id);
                        if (isOpen) setEditingUser(null);
                      }}
                    >
                      {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </GhostButton>
                    <PrimaryButton onClick={() => handleEdit(user)}>Edit</PrimaryButton>
                  </div>
                </div>

                {isOpen && renderDetails(user)}
              </Panel>
            );
          })
        ) : (
          <Panel>
            {loadError ? (
              <EmptyState icon={AlertTriangle} title="Couldn't load users" hint={loadError} />
            ) : (
              <EmptyState
                icon={Inbox}
                title={search ? "No matches" : "No users yet"}
                hint={search ? "No users match that search." : "Registered users appear here."}
              />
            )}
          </Panel>
        )}
      </div>

      {/* ── Desktop: table ──────────────────────────────────────────────── */}
      <Panel className="hidden overflow-hidden md:block">
        {loading ? (
          <div className={`divide-y ${T.divide}`}>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-4">
                <div className="h-8 w-8 animate-pulse rounded-full bg-[#EFEFEC] dark:bg-white/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-40 animate-pulse rounded bg-[#EFEFEC] dark:bg-white/10" />
                  <div className="h-3 w-56 animate-pulse rounded bg-[#EFEFEC] dark:bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        ) : paginated.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className={`border-b ${T.hairline} bg-[#FAFAF8] dark:bg-white/[0.02]`}>
                <tr>
                  <Th>User</Th>
                  <Th>Role</Th>
                  <Th>Plan</Th>
                  <Th>Credits</Th>
                  <Th>Applications</Th>
                  <Th>Joined</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody className={`divide-y ${T.divide}`}>
                {paginated.map((user) => {
                  const isOpen = expandedUser === user.id;
                  const isEditing = editingUser === user.id;

                  return (
                    <React.Fragment key={user.id}>
                      <tr className={`transition-colors ${T.hover}`}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={user.full_name || "?"} />
                            <div className="min-w-0">
                              <p className={`truncate text-[13px] font-semibold ${T.ink}`}>
                                {user.full_name}
                              </p>
                              <p className={`truncate text-[11px] ${T.muted}`}>{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 text-[11.5px] font-medium capitalize ${T.ink2}`}>
                            {user.role === "admin"
                              ? <Shield size={11} className="text-[#D03B3B]" />
                              : <User size={11} className={T.muted} />}
                            {user.role}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex rounded-md border ${T.hairline} px-1.5 py-0.5 text-[11px] font-medium ${T.ink}`}>
                            {PLAN_LABEL[user.plan || "free"] || user.plan}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className={`text-[12.5px] font-semibold tabular-nums ${T.ink}`}>
                              {user.credits_remaining}
                            </span>
                            <button
                              onClick={() => handleAddCredits(user.id, 200)}
                              title="Add 200 credits"
                              className={`inline-flex items-center gap-0.5 rounded-md border ${T.hairline} px-1.5 py-0.5
                                          text-[10.5px] font-semibold ${T.ink2} transition-colors
                                          hover:bg-[#F4F4F2] dark:hover:bg-white/5`}
                            >
                              <Plus size={9} strokeWidth={3} />200
                            </button>
                          </div>
                        </td>
                        <td className={`px-5 py-3.5 text-[12.5px] tabular-nums ${T.ink2}`}>
                          {user.total_applications}
                        </td>
                        <td className="px-5 py-3.5">
                          <p className={`text-[12px] tabular-nums ${T.ink2}`}>
                            {format(new Date(user.created_at), "d MMM yyyy")}
                          </p>
                          <p className={`text-[10.5px] ${T.muted}`}>
                            {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                          </p>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-2">
                            <GhostButton
                              onClick={() => {
                                setExpandedUser(isOpen ? null : user.id);
                                if (isOpen) setEditingUser(null);
                              }}
                            >
                              {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            </GhostButton>
                            <PrimaryButton onClick={() => handleEdit(user)}>Edit</PrimaryButton>
                          </div>
                        </td>
                      </tr>

                      {isOpen && (
                        <tr>
                          <td colSpan={7} className="p-0">
                            {renderDetails(user)}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : loadError ? (
          <EmptyState icon={AlertTriangle} title="Couldn't load users" hint={loadError} />
        ) : (
          <EmptyState
            icon={Inbox}
            title={search ? "No matches" : "No users yet"}
            hint={search ? "No users match that search." : "Registered users appear here."}
          />
        )}
      </Panel>

      <Pagination page={currentPage} totalPages={totalPages} onChange={setCurrentPage} />
    </div>
  );
};

export default UserManagementPage;
