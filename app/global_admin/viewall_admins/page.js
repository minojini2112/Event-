"use client";
import { useEffect, useMemo, useState } from "react";
import { AuthGuard } from "../../../lib/authGuard";

export default function ViewAllAdminsPage() {
  return (
    <AuthGuard requiredRole="global">
      <AdminsTable />
    </AuthGuard>
  );
}

function AdminsTable() {
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

  const statusBadge = (status) => {
    if (status === "approved") return "bg-[#10B981] text-white border-[#10B981]";
    if (status === "rejected") return "bg-[#F59E0B] text-white border-[#F59E0B]";
    return "bg-[#64748B] text-white border-[#64748B]"; // pending/default
  };

  // Stats calculation
  const stats = useMemo(() => {
    const totalRequests = filtered.length;
    const totalAdmins = groupedByAdmin.length;
    const pending = filtered.filter(r => r.status === 'pending').length;
    const approved = filtered.filter(r => r.status === 'approved').length;
    const rejected = filtered.filter(r => r.status === 'rejected').length;
    
    return { totalRequests, totalAdmins, pending, approved, rejected };
  }, [filtered, groupedByAdmin]);

  return (
    <div className="min-h-screen bg-[#F8FAFC]" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-[#3B82F6] rounded-xl shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-[2.5rem] font-semibold text-[#334155] leading-tight">
                  Admins & Event Access
                </h1>
                <p className="text-[#64748B] text-lg mt-2">Overview of admins, requested/created events, and their status.</p>
              </div>
            </div>
            <button
              onClick={() => window.history.back()}
              className="bg-[#3B82F6] hover:bg-[#1E40AF] text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Back
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#64748B]">Total Events</p>
                <p className="text-2xl font-semibold text-[#334155] mt-1">{stats.totalRequests}</p>
              </div>
              <div className="p-2 bg-[#EFF6FF] rounded-lg">
                <svg className="w-6 h-6 text-[#3B82F6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#3B82F6]">Total Admins</p>
                <p className="text-2xl font-semibold text-[#1E40AF] mt-1">{stats.totalAdmins}</p>
              </div>
              <div className="p-2 bg-[#EFF6FF] rounded-lg">
                <svg className="w-6 h-6 text-[#3B82F6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#F59E0B]">Pending</p>
                <p className="text-2xl font-semibold text-[#F59E0B] mt-1">{stats.pending}</p>
              </div>
              <div className="p-2 bg-[#FEF3C7] rounded-lg">
                <svg className="w-6 h-6 text-[#F59E0B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#10B981]">Approved</p>
                <p className="text-2xl font-semibold text-[#10B981] mt-1">{stats.approved}</p>
              </div>
              <div className="p-2 bg-[#D1FAE5] rounded-lg">
                <svg className="w-6 h-6 text-[#10B981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#F59E0B]">Rejected</p>
                <p className="text-2xl font-semibold text-[#F59E0B] mt-1">{stats.rejected}</p>
              </div>
              <div className="p-2 bg-[#FEF3C7] rounded-lg">
                <svg className="w-6 h-6 text-[#F59E0B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-6 bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#EFF6FF] rounded-lg">
                  <svg className="w-5 h-5 text-[#3B82F6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
                  </svg>
                </div>
                <label className="text-sm font-medium text-[#334155]">Filter by Status:</label>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 text-sm border border-[#E2E8F0] rounded-xl focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] bg-white text-[#334155] transition-all duration-200 hover:shadow-md min-w-[140px]"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            
            <div className="relative max-w-sm w-full">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-[#64748B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
                </svg>
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search admin, event or status..."
                className="w-full text-sm pl-12 pr-4 py-3 border border-[#E2E8F0] rounded-xl focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] bg-white text-[#334155] placeholder-[#64748B] transition-all duration-200 hover:shadow-md"
              />
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-[#3B82F6] rounded-full"></div>
            <p className="text-sm text-[#64748B]">
              Showing <span className="font-semibold text-[#3B82F6]">{filtered.length}</span> event entr{filtered.length === 1 ? 'y' : 'ies'} across <span className="font-semibold text-[#06B6D4]">{groupedByAdmin.length}</span> admin{groupedByAdmin.length === 1 ? '' : 's'}
            </p>
          </div>
          
          <div className="text-xs text-[#64748B] bg-[#F8FAFC] px-3 py-2 rounded-full border border-[#E2E8F0]">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-[#E2E8F0] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed text-sm">
              <colgroup>
                <col className="w-1/4" />
                <col className="w-2/5" />
                <col className="w-1/5" />
                <col className="w-1/5" />
              </colgroup>
              <thead className="sticky top-0 z-10 bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <tr>
                  <th className="text-left px-8 py-5 font-semibold text-[#334155] uppercase tracking-wide">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#64748B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Admin
                    </div>
                  </th>
                  <th className="text-left px-8 py-5 font-semibold text-[#334155] uppercase tracking-wide">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#64748B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 6v6a2 2 0 002 2h4a2 2 0 002-2v-6" />
                      </svg>
                      Event Name
                    </div>
                  </th>
                  <th className="text-left px-8 py-5 font-semibold text-[#334155] uppercase tracking-wide">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#64748B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Status
                    </div>
                  </th>
                  <th className="text-left px-8 py-5 font-semibold text-[#334155] uppercase tracking-wide">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#64748B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Requested
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] bg-white">
                {loading && (
                  <tr>
                    <td colSpan={4} className="px-8 py-12 text-center">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#E2E8F0] border-t-[#3B82F6]"></div>
                        <p className="text-[#64748B] font-medium">Loading admin data...</p>
                      </div>
                    </td>
                  </tr>
                )}
                {error && !loading && (
                  <tr>
                    <td colSpan={4} className="px-8 py-12 text-center">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="text-[#F59E0B]">
                          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        </div>
                        <p className="text-[#F59E0B] font-semibold text-lg">{error}</p>
                      </div>
                    </td>
                  </tr>
                )}
                {!loading && !error && filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-8 py-12 text-center">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="text-[#64748B]">
                          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-[#334155] font-semibold text-lg">No records found</p>
                          <p className="text-[#64748B] mt-1">Try adjusting your search or filter criteria</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                {!loading && !error && groupedByAdmin.map(([adminName, items]) => (
                  items.map((r, idx) => (
                    <tr key={r.id} className="group hover:bg-[#F8FAFC] transition-all duration-200">
                      {idx === 0 && (
                        <td rowSpan={items.length} className="px-8 py-6 align-top bg-[#F8FAFC] border-r border-[#E2E8F0]">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 bg-[#3B82F6] rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
                                {adminName.charAt(0).toUpperCase()}
                              </div>
                            </div>
                            <div>
                              <p className="font-semibold text-[#334155] text-base group-hover:text-[#3B82F6] transition-colors">{adminName}</p>
                              <p className="text-xs text-[#64748B] mt-1">{items.length} event{items.length !== 1 ? 's' : ''}</p>
                            </div>
                          </div>
                        </td>
                      )}
                      <td className="px-8 py-6 text-[#334155] font-medium">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-[#06B6D4] rounded-full flex-shrink-0"></div>
                          <span className="truncate max-w-[20rem]" title={r.event_name || ''}>
                            {r.event_name || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all duration-200 ${statusBadge(r.status)}`}>
                          <div className={`w-2 h-2 rounded-full ${
                            r.status === 'approved' ? 'bg-white' :
                            r.status === 'rejected' ? 'bg-white' :
                            'bg-white'
                          }`}></div>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-[#64748B] font-medium">
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-[#64748B] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 6v6a2 2 0 002 2h4a2 2 0 002-2v-6" />
                          </svg>
                          <span className="whitespace-nowrap">
                            {r.requested_at ? new Date(r.requested_at).toLocaleString() : '-'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-[#E2E8F0] rounded-full shadow-sm">
            <div className="w-2 h-2 bg-[#10B981] rounded-full"></div>
            <p className="text-sm text-[#64748B]">
              Real-time data • Auto-refreshes on filter changes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}