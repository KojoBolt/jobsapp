import { useState, useEffect } from "react";
import { Search, ChevronDown, ChevronUp, Shield, User, CreditCard } from "lucide-react";
import { Button } from "../ui/Button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/admin/toast/ToastContext";
import { format } from "date-fns";

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

const planColors: Record<string, string> = {
  basic:    "bg-gray-100 text-gray-600",
  starter: "bg-blue-100 text-blue-600",
  pro:     "bg-purple-100 text-purple-600",
};

const roleColors: Record<string, string> = {
  admin:  "bg-red-100 text-red-600",
  client: "bg-green-100 text-green-600",
};

const UserManagementPage = (): JSX.Element => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    plan: string;
    credits: number;
    role: string;
  }>({ plan: "free", credits: 0, role: "client" });
  const [saving, setSaving] = useState(false);
  const { pushToast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      // Fetch all profiles
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        pushToast({ variant: "error", title: "Error", message: "Failed to load users" });
        return;
      }

      // Fetch application counts per user
      const { data: appCounts } = await supabase
        .from("applications")
        .select("user_id");

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
    } catch (err) {
      pushToast({ variant: "error", title: "Error", message: "Unexpected error" });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: UserProfile) => {
    setEditingUser(user.id);
    setEditValues({
      plan: user.plan || "free",
      credits: user.credits_remaining,
      role: user.role || "client",
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

      setUsers((prev) => prev.map((u) =>
        u.id === userId
          ? { ...u, plan: editValues.plan, credits_remaining: editValues.credits, role: editValues.role }
          : u
      ));

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

    setUsers((prev) => prev.map((u) =>
      u.id === userId ? { ...u, credits_remaining: newCredits } : u
    ));
    pushToast({ variant: "success", title: "Credits Added", message: `Added ${amount} credits` });
  };

  const filtered = users.filter((u) =>
    (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getInitials = (name: string) =>
    name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B] dark:text-white">User Management</h1>
          <p className="text-sm text-[#64748B] mt-1">
            {loading ? "Loading..." : `${filtered.length} user${filtered.length !== 1 ? "s" : ""} total`}
          </p>
        </div>
        <div className="relative w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C3AED] text-[#1E293B] placeholder:text-[#94A3B8] dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400 dark:focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid md:grid-cols-3 gap-4 grid-cols-1">
        {[
          { label: "Total Users", value: users.length, color: "#7C3AED" },
          { label: "Pro Users", value: users.filter((u) => u.plan === "pro").length, color: "#10B981" },
          { label: "Basic Users", value: users.filter((u) => u.plan === "free").length, color: "#F59E0B" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-[#E2E8F0] dark:border-gray-700 p-4">
            <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
            <p className="text-sm text-[#64748B]">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7C3AED]" />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-[#E2E8F0] dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#7C3AED] text-white">
                <th className="px-6 py-4 text-left text-sm font-semibold">User</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Role</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Plan</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Credits</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Applications</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Joined</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {paginated.map((user) => (
                <>
                  <tr
                    key={user.id}
                    className="hover:bg-[#F8FAFC] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#EDE9FE] flex items-center justify-center text-[#7C3AED] text-xs font-bold shrink-0">
                          {getInitials(user.full_name || "?")}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#1E293B]">{user.full_name}</p>
                          <p className="text-xs text-[#64748B]">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${roleColors[user.role || "client"] || "bg-gray-100 text-gray-600"}`}>
                        {user.role === "admin" ? <Shield size={10} /> : <User size={10} />}
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${planColors[user.plan || "basic"] || "bg-gray-100 text-gray-600"}`}>
                        {user.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#1E293B]">
                          {user.credits_remaining}
                        </span>
                        <button
                          onClick={() => handleAddCredits(user.id, 200)}
                          className="text-xs text-[#7C3AED] hover:underline"
                          title="Add 200 credits"
                        >
                          +200
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#64748B]">
                      {user.total_applications}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#64748B]">
                      {format(new Date(user.created_at), "d MMM yyyy")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setExpandedUser(
                            expandedUser === user.id ? null : user.id
                          )}
                          className="p-1.5 rounded hover:bg-[#F1F5F9] text-[#64748B]"
                        >
                          {expandedUser === user.id
                            ? <ChevronUp size={16} />
                            : <ChevronDown size={16} />
                          }
                        </button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleEdit(user)}
                        >
                          Edit
                        </Button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Edit Row */}
                  {expandedUser === user.id && (
                    <tr key={`${user.id}-expanded`}>
                      <td colSpan={7} className="px-6 py-4 bg-[#F8FAFC] border-t border-[#E2E8F0]">
                        {editingUser === user.id ? (
                          <div className="flex flex-wrap items-end gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-[#64748B] mb-1">Plan</label>
                              <select
                                value={editValues.plan}
                                onChange={(e) => setEditValues((p) => ({ ...p, plan: e.target.value }))}
                                className="px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                              >
                                <option value="free">Basic Plan</option>
                                <option value="starter">Starter</option>
                                <option value="pro">Pro</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-[#64748B] mb-1">Credits</label>
                              <input
                                type="number"
                                value={editValues.credits}
                                onChange={(e) => setEditValues((p) => ({ ...p, credits: Number(e.target.value) }))}
                                className="w-24 px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-[#64748B] mb-1">Role</label>
                              <select
                                value={editValues.role}
                                onChange={(e) => setEditValues((p) => ({ ...p, role: e.target.value }))}
                                className="px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                              >
                                <option value="client">Client</option>
                                <option value="admin">Admin</option>
                              </select>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleSave(user.id)}
                                disabled={saving}
                              >
                                {saving ? "Saving..." : "Save"}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingUser(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-xs text-[#64748B] mb-1">Monthly Usage</p>
                              <p className="font-semibold text-[#1E293B]">{user.monthly_usage_count} / month</p>
                            </div>
                            <div>
                              <p className="text-xs text-[#64748B] mb-1">Total Applications</p>
                              <p className="font-semibold text-[#1E293B]">{user.total_applications}</p>
                            </div>
                            <div>
                              <p className="text-xs text-[#64748B] mb-1">User ID</p>
                              <p className="font-mono text-xs text-[#64748B]">{user.id.slice(0, 16)}...</p>
                            </div>
                            <div>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleEdit(user)}
                              >
                                Edit User
                              </Button>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#64748B]">Page {currentPage} of {totalPages}</p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm border border-[#E2E8F0] rounded-lg text-[#64748B] hover:bg-[#F8FAFC] disabled:opacity-40"
            >
              ← Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1.5 text-sm border rounded-lg transition-colors ${
                  currentPage === page
                    ? "border-[#7C3AED] bg-[#7C3AED] text-white"
                    : "border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm border border-[#E2E8F0] rounded-lg text-[#64748B] hover:bg-[#F8FAFC] disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;