'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '../../../lib/authGuard';

export default function AccessRequestsPage() {
  return (
    <AuthGuard requiredRole="global">
      <AccessRequestsContent />
    </AuthGuard>
  );
}

function AccessRequestsContent() {
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchRequests();
  }, [filterStatus, fetchRequests]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const url = filterStatus === 'all' 
        ? '/api/access-requests' 
        : `/api/access-requests?status=${filterStatus}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        setRequests(data.requests || []);
      } else {
        setError(data.error || 'Failed to fetch requests');
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Failed to load access requests');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId, newStatus) => {
    try {
      const userId = localStorage.getItem('userId');
      const username = localStorage.getItem('username');

      if (!userId || !username) {
        alert('User information not found. Please log in again.');
        return;
      }

      const response = await fetch(`/api/access-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          globalAdminId: userId,
          globalAdminUsername: username
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Request ${newStatus} successfully!`);
        fetchRequests(); // Refresh the list
      } else {
        alert(`Error: ${data.error || 'Failed to update request'}`);
      }
    } catch (error) {
      console.error('Error updating request status:', error);
      alert('Failed to update request status. Please try again.');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: 'bg-[#64748B]', text: 'text-white', border: 'border-[#64748B]', dot: 'bg-white' },
      approved: { bg: 'bg-[#10B981]', text: 'text-white', border: 'border-[#10B981]', dot: 'bg-white' },
      rejected: { bg: 'bg-[#F59E0B]', text: 'text-white', border: 'border-[#F59E0B]', dot: 'bg-white' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${config.bg} ${config.text} ${config.border}`}>
        <div className={`w-2 h-2 rounded-full ${config.dot}`}></div>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Stats calculation
  const stats = {
    totalRequests: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 bg-white border-b border-[#E2E8F0] shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="relative">
            <div className="text-center">
                <h1 className="text-2xl sm:text-3xl lg:text-[2.5rem] font-semibold text-[#334155] leading-tight">
                Access Requests
              </h1>
                <p className="text-[#64748B] mt-1 sm:mt-2 text-sm sm:text-base lg:text-lg">Review and manage admin access requests</p>
            </div>
          <button
            onClick={() => router.push('/main/0')}
              className="absolute top-0 right-0 bg-[#3B82F6] hover:bg-[#1E40AF] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md text-sm sm:text-base w-full sm:w-auto"
          >
            Back to Dashboard
          </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sm:mb-8">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-[#64748B]">Total Requests</p>
                <p className="text-xl sm:text-2xl font-semibold text-[#334155] mt-1">{stats.totalRequests}</p>
              </div>
              <div className="p-2 bg-[#EFF6FF] rounded-lg">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#3B82F6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-[#64748B]">Pending</p>
                <p className="text-xl sm:text-2xl font-semibold text-[#64748B] mt-1">{stats.pending}</p>
              </div>
              <div className="p-2 bg-[#F1F5F9] rounded-lg">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#64748B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-[#10B981]">Approved</p>
                <p className="text-xl sm:text-2xl font-semibold text-[#10B981] mt-1">{stats.approved}</p>
              </div>
              <div className="p-2 bg-[#D1FAE5] rounded-lg">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#10B981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-[#F59E0B]">Rejected</p>
                <p className="text-xl sm:text-2xl font-semibold text-[#F59E0B] mt-1">{stats.rejected}</p>
              </div>
              <div className="p-2 bg-[#FEF3C7] rounded-lg">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#F59E0B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 sm:mb-8 bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#EFF6FF] rounded-lg">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#3B82F6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
                </svg>
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-[#334155]">Filter Requests</h2>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 sm:px-4 py-2 sm:py-2.5 border border-[#E2E8F0] rounded-xl focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] bg-white text-[#334155] transition-colors text-sm sm:text-base"
              >
                <option value="all">All Requests</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <button
                onClick={fetchRequests}
                className="bg-[#3B82F6] hover:bg-[#1E40AF] text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-medium transition-colors shadow-sm text-sm sm:text-base"
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="hidden sm:inline">Refresh</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-[#3B82F6] rounded-full"></div>
            <p className="text-xs sm:text-sm text-[#64748B]">
              Showing <span className="font-semibold text-[#3B82F6]">{requests.length}</span> access request{requests.length === 1 ? '' : 's'}
            </p>
          </div>
          
          <div className="text-xs text-[#64748B] bg-[#F8FAFC] px-3 py-2 rounded-full border border-[#E2E8F0] self-start sm:self-auto">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>

        {/* Requests List */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
          {loading && (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#E2E8F0] border-t-[#3B82F6] mx-auto mb-6"></div>
              <p className="text-[#64748B] text-lg">Loading access requests...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-16">
              <div className="text-[#F59E0B] mb-6">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-[#F59E0B] text-lg">{error}</p>
            </div>
          )}

          {!loading && !error && requests.length === 0 && (
            <div className="text-center py-16">
              <div className="text-[#64748B] mb-6">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-[#334155] font-semibold text-lg">No access requests found</p>
                <p className="text-[#64748B] mt-1">Try adjusting your filter criteria</p>
              </div>
            </div>
          )}

          {!loading && !error && requests.length > 0 && (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <tr>
                      <th className="px-6 lg:px-8 py-4 lg:py-5 text-left text-sm font-semibold text-[#334155] uppercase tracking-wide">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#64748B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Admin Details
                      </div>
                    </th>
                      <th className="px-6 lg:px-8 py-4 lg:py-5 text-left text-sm font-semibold text-[#334155] uppercase tracking-wide">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#64748B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 6v6a2 2 0 002 2h4a2 2 0 002-2v-6" />
                        </svg>
                        Event Request
                      </div>
                    </th>
                      <th className="px-6 lg:px-8 py-4 lg:py-5 text-left text-sm font-semibold text-[#334155] uppercase tracking-wide">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#64748B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Status
                      </div>
                    </th>
                      <th className="px-6 lg:px-8 py-4 lg:py-5 text-left text-sm font-semibold text-[#334155] uppercase tracking-wide">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#64748B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Requested
                      </div>
                    </th>
                      <th className="px-6 lg:px-8 py-4 lg:py-5 text-left text-sm font-semibold text-[#334155] uppercase tracking-wide">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#64748B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                        </svg>
                        Actions
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-[#E2E8F0]">
                  {requests.map((request) => (
                    <tr key={request.id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="px-6 lg:px-8 py-4 lg:py-6">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-[#3B82F6] rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm">
                              {request.admin_username?.charAt(0).toUpperCase() || 'A'}
                            </div>
                          </div>
                          <div>
                              <p className="text-sm lg:text-base font-semibold text-[#334155]">{request.admin_username}</p>
                              <p className="text-xs lg:text-sm text-[#64748B] mt-1">{request.admin_email}</p>
                          </div>
                        </div>
                      </td>
                        <td className="px-6 lg:px-8 py-4 lg:py-6">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-[#06B6D4] rounded-full flex-shrink-0"></div>
                            <p className="text-sm lg:text-base text-[#334155] font-medium">{request.event_name}</p>
                        </div>
                      </td>
                        <td className="px-6 lg:px-8 py-4 lg:py-6">
                        {getStatusBadge(request.status)}
                      </td>
                        <td className="px-6 lg:px-8 py-4 lg:py-6">
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-[#64748B] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 6v6a2 2 0 002 2h4a2 2 0 002-2v-6" />
                          </svg>
                            <span className="text-sm lg:text-base text-[#334155]">{formatDate(request.requested_at)}</span>
                        </div>
                      </td>
                        <td className="px-6 lg:px-8 py-4 lg:py-6">
                          {request.status === 'pending' && (
                            <div className="flex items-center gap-2 lg:gap-3">
                              <button
                                onClick={() => handleStatusUpdate(request.id, 'approved')}
                                className="bg-[#10B981] hover:bg-[#059669] text-white px-3 lg:px-4 py-1.5 lg:py-2 rounded-xl text-xs lg:text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-1 lg:gap-2"
                              >
                                <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="hidden sm:inline">Approve</span>
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(request.id, 'rejected')}
                                className="bg-[#F59E0B] hover:bg-[#D97706] text-white px-3 lg:px-4 py-1.5 lg:py-2 rounded-xl text-xs lg:text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-1 lg:gap-2"
                              >
                                <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                <span className="hidden sm:inline">Reject</span>
                              </button>
                            </div>
                          )}
                          {request.status === 'approved' && (
                            <div className="text-xs lg:text-sm text-[#64748B] leading-relaxed">
                              <div className="flex items-center gap-2 mb-1">
                                <svg className="w-3 h-3 lg:w-4 lg:h-4 text-[#10B981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="font-medium text-[#334155]">Approved by {request.reviewed_by_username}</p>
                              </div>
                              {request.reviewed_at && (
                                <p className="text-[#64748B] ml-5 lg:ml-6">{formatDate(request.reviewed_at)}</p>
                              )}
                            </div>
                          )}
                          {request.status === 'rejected' && (
                            <div className="text-xs lg:text-sm text-[#64748B] leading-relaxed">
                              <div className="flex items-center gap-2 mb-1">
                                <svg className="w-3 h-3 lg:w-4 lg:h-4 text-[#F59E0B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="font-medium text-[#334155]">Rejected by {request.reviewed_by_username}</p>
                              </div>
                              {request.reviewed_at && (
                                <p className="text-[#64748B] ml-5 lg:ml-6">{formatDate(request.reviewed_at)}</p>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-4 p-4">
                {requests.map((request) => (
                  <div key={request.id} className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-[#3B82F6] rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm">
                          {request.admin_username?.charAt(0).toUpperCase() || 'A'}
                        </div>
                        <div>
                          <p className="text-base font-semibold text-[#334155]">{request.admin_username}</p>
                          <p className="text-sm text-[#64748B]">{request.admin_email}</p>
                        </div>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-[#06B6D4] rounded-full flex-shrink-0"></div>
                        <p className="text-sm text-[#334155] font-medium">{request.event_name}</p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-[#64748B] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 6v6a2 2 0 002 2h4a2 2 0 002-2v-6" />
                        </svg>
                        <span className="text-sm text-[#334155]">{formatDate(request.requested_at)}</span>
                      </div>
                      
                        {request.status === 'pending' && (
                        <div className="flex items-center gap-3 pt-2">
                            <button
                              onClick={() => handleStatusUpdate(request.id, 'approved')}
                            className="flex-1 bg-[#10B981] hover:bg-[#059669] text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Approve
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(request.id, 'rejected')}
                            className="flex-1 bg-[#F59E0B] hover:bg-[#D97706] text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Reject
                            </button>
                          </div>
                        )}
                      
                        {request.status === 'approved' && (
                        <div className="text-sm text-[#64748B] leading-relaxed pt-2 border-t border-[#E2E8F0]">
                            <div className="flex items-center gap-2 mb-1">
                              <svg className="w-4 h-4 text-[#10B981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <p className="font-medium text-[#334155]">Approved by {request.reviewed_by_username}</p>
                            </div>
                            {request.reviewed_at && (
                              <p className="text-[#64748B] ml-6">{formatDate(request.reviewed_at)}</p>
                            )}
                          </div>
                        )}
                      
                        {request.status === 'rejected' && (
                        <div className="text-sm text-[#64748B] leading-relaxed pt-2 border-t border-[#E2E8F0]">
                            <div className="flex items-center gap-2 mb-1">
                              <svg className="w-4 h-4 text-[#F59E0B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <p className="font-medium text-[#334155]">Rejected by {request.reviewed_by_username}</p>
                            </div>
                            {request.reviewed_at && (
                              <p className="text-[#64748B] ml-6">{formatDate(request.reviewed_at)}</p>
                            )}
                          </div>
                        )}
                    </div>
                  </div>
                  ))}
            </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 sm:mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-white border border-[#E2E8F0] rounded-full shadow-sm">
            <div className="w-2 h-2 bg-[#10B981] rounded-full"></div>
            <p className="text-xs sm:text-sm text-[#64748B]">
              Real-time data • Auto-refreshes on filter changes
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}