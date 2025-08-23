"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "../../../lib/authGuard";

export default function ViewAllAdminsPage() {
  return (
    <AuthGuard requiredRole="global">
      <AdminsTable />
    </AuthGuard>
  );
}

function AdminsTable() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState(""); // '', 'pending', 'approved', 'rejected'
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const url = statusFilter
          ? `/api/access-requests?status=${statusFilter}`
          : "/api/access-requests";
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to load data");
        const json = await res.json();
        setRequests(Array.isArray(json.requests) ? json.requests : []);
        setError("");
      } catch {
        setError("Failed to load admins. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [statusFilter]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return requests;
    return requests.filter((r) => {
      const admin = (r.admin_username || "").toLowerCase();
      const ev = (r.event_name || "").toLowerCase();
      const st = (r.status || "").toLowerCase();
      return admin.includes(term) || ev.includes(term) || st.includes(term);
    });
  }, [requests, search]);

  // Group rows by admin to avoid repeating the admin name
  const groupedByAdmin = useMemo(() => {
    const map = new Map();
    filtered.forEach((r) => {
      const key = r.admin_username || r.admin_id || "Unknown";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(r);
    });
    return Array.from(map.entries());
  }, [filtered]);

  // Navigate to event details by event name (best-effort)
  const handleOpenEventByName = async (eventName, adminId) => {
    try {
      const res = await fetch("/api/events");
      if (!res.ok) throw new Error("Failed to fetch events");
      const json = await res.json();
      const list = Array.isArray(json.events) ? json.events : [];
      const normalized = (s) => (s || "").toString().trim().toLowerCase();
      // Prefer exact name + same admin when possible
      let found = list.find((e) => normalized(e.event_name) === normalized(eventName) && (String(e.admin_id||e.created_by||"") === String(adminId||"")));
      if (!found) {
        found = list.find((e) => normalized(e.event_name) === normalized(eventName));
      }
      if (!found) {
        alert("Event not found or not yet created.");
        return;
      }
      try {
        if (typeof window !== "undefined") {
          window.localStorage.setItem("selected_event", JSON.stringify(found));
        }
      } catch {}
      router.push(`/particularevent?id=${found.event_id}`);
    } catch {
      alert("Unable to open event. Please try again.");
    }
  };

  const statusBadge = (status) => {
    if (status === "approved") return "bg-green-100 text-green-700 border-green-200";
    if (status === "rejected") return "bg-red-100 text-red-700 border-red-200";
    return "bg-amber-100 text-amber-700 border-amber-200"; // pending/default
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 px-6 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Admins & Event Access
          </h1>
          <p className="text-gray-600">Overview of admins, requested/created events, and their status.</p>
        </div>

        {/* Controls */}
        <div className="mb-4 bg-white/90 backdrop-blur-sm border border-gray-200/60 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border rounded-lg"
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="relative max-w-sm w-full">
            <span className="pointer-events-none absolute inset-y-0 left-3 inline-flex items-center">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
              </svg>
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search admin, event or status"
              className="w-full text-sm pl-9 pr-3 py-2 border rounded-lg text-black placeholder-gray-500"
            />
          </div>
        </div>

        {/* Summary */}
        <div className="mb-3 text-sm text-gray-700">
          Showing <span className="font-semibold">{filtered.length}</span> event entr{filtered.length === 1 ? 'y' : 'ies'} across <span className="font-semibold">{groupedByAdmin.length}</span> admin{groupedByAdmin.length === 1 ? '' : 's'}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-auto">
          <table className="min-w-full table-fixed text-sm">
            <colgroup>
              <col className="w-1/4" />
              <col className="w-2/5" />
              <col className="w-1/5" />
              <col className="w-1/5" />
            </colgroup>
            <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
              <tr>
                <th className="text-left px-6 py-3 font-semibold text-gray-700">Admin</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-700">Event Name</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-700">Status</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-700">Requested</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td colSpan={4} className="px-6 py-6 text-center text-gray-600">Loading...</td>
                </tr>
              )}
              {error && !loading && (
                <tr>
                  <td colSpan={4} className="px-6 py-6 text-center text-red-600">{error}</td>
                </tr>
              )}
              {!loading && !error && filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-6 text-center text-gray-600">No records found</td>
                </tr>
              )}
              {!loading && !error && groupedByAdmin.map(([adminName, items]) => (
                items.map((r, idx) => (
                  <tr key={r.id} className="odd:bg-white even:bg-gray-50/40 hover:bg-gray-50 transition-colors">
                    {idx === 0 && (
                      <td rowSpan={items.length} className="px-6 py-4 text-gray-900 align-top font-semibold bg-gray-50 border-r border-gray-100">{adminName}</td>
                    )}
                    <td className="px-6 py-4 text-gray-900 max-w-[28rem] truncate" title={r.event_name || ''}>
                      {r.event_name ? (
                        <button
                          onClick={() => handleOpenEventByName(r.event_name, r.admin_id)}
                          className="text-blue-700 hover:text-blue-900 hover:underline"
                          title="Open event"
                        >
                          {r.event_name}
                        </button>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-medium ${statusBadge(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{r.requested_at ? new Date(r.requested_at).toLocaleString() : '-'}</td>
                  </tr>
                ))
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


