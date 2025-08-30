'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

import { AuthGuard } from '../../../lib/authGuard';
import { getEventStatus, getAvailableSlots, formatEventDate } from '../../../lib/eventUtils';

export default function GlobalAdminMainPage() {
  return (
    <AuthGuard requiredRole="global">
      <GlobalAdminMainPageContent />
    </AuthGuard>
  );
}

function GlobalAdminMainPageContent() {
  const router = useRouter();
  // Profile dropdown state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);
  // Track active/hovered menu item for visual highlight
  const [activeMenu, setActiveMenu] = useState(null);
  // Global admin: no access request flow

  // User data from localStorage + dashboard stats
  const [userData, setUserData] = useState({
    username: 'Loading...',
    email: 'Loading...',
    userType: 'admin',
    eventsCreated: 0,
    totalParticipants: 0,
    activeEvents: 0,
    upcomingEvents: 0,
    pastEvents: 0
  });

  // Load user data
  useEffect(() => {
    // Load user data from localStorage
    const username = localStorage.getItem('username') || 'Admin';
    const email = localStorage.getItem('email') || 'No email';
    
    setUserData(prev => ({
      ...prev,
      username,
      email
    }));
  }, []);

  // Load dashboard stats from backend (same as admin dashboard)
  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await fetch('/api/events/stats');
        if (!res.ok) return;
        const stats = await res.json();
        setUserData((prev) => ({
          ...prev,
          eventsCreated: stats.totalEvents ?? prev.eventsCreated,
          totalParticipants: stats.totalParticipants ?? prev.totalParticipants,
          activeEvents: stats.liveEvents ?? prev.activeEvents,
          upcomingEvents: stats.upcomingEvents ?? prev.upcomingEvents,
          pastEvents: stats.pastEvents ?? prev.pastEvents,
        }));
      } catch {}
    };
    loadStats();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Events state - will be populated from API
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch events from API
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/events');
        
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }
        
        const data = await response.json();
        setEvents(data.events || []);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Failed to load events. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Filters state (compact controls: month, day of week, exact date)
  const [filterMonth, setFilterMonth] = useState(''); // '' = All
  const [filterDay, setFilterDay] = useState(''); // '' = All, 0-6 = Sun-Sat
  const [filterDate, setFilterDate] = useState(''); // '' = All, 'YYYY-MM-DD'
  const [filterTitle, setFilterTitle] = useState(''); // title substring

  // Helpers
  const months = useMemo(
    () => [
      { value: '', label: 'All months' },
      { value: '0', label: 'January' },
      { value: '1', label: 'February' },
      { value: '2', label: 'March' },
      { value: '3', label: 'April' },
      { value: '4', label: 'May' },
      { value: '5', label: 'June' },
      { value: '6', label: 'July' },
      { value: '7', label: 'August' },
      { value: '8', label: 'September' },
      { value: '9', label: 'October' },
      { value: '10', label: 'November' },
      { value: '11', label: 'December' }
    ],
    []
  );

  const days = useMemo(
    () => [
      { value: '', label: 'All days' },
      { value: '0', label: 'Sunday' },
      { value: '1', label: 'Monday' },
      { value: '2', label: 'Tuesday' },
      { value: '3', label: 'Wednesday' },
      { value: '4', label: 'Thursday' },
      { value: '5', label: 'Friday' },
      { value: '6', label: 'Saturday' }
    ],
    []
  );

  const parseLocalYmd = (ymd) => {
    if (!ymd) return null;
    const [y, m, d] = ymd.split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  };

  const isSameLocalDate = (a, b) => {
    if (!a || !b) return false;
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  };

  const clearFilters = () => {
    setFilterMonth('');
    setFilterDay('');
    setFilterDate('');
    setFilterTitle('');
  };

  // Compute filtered events
  const filteredEvents = useMemo(() => {
    const selectedDateObj = parseLocalYmd(filterDate);
    return events.filter((event) => {
      const eventDate = new Date(event.start_date);
      if (Number.isNaN(eventDate.getTime())) return false;

      if (filterTitle.trim()) {
        const hay = `${event.event_name}`.toLowerCase();
        const needle = filterTitle.trim().toLowerCase();
        if (!hay.includes(needle)) return false;
      }

      if (filterMonth !== '' && eventDate.getMonth().toString() !== filterMonth) {
        return false;
      }
      if (filterDay !== '' && eventDate.getDay().toString() !== filterDay) {
        return false;
      }
      if (selectedDateObj && !isSameLocalDate(eventDate, selectedDateObj)) {
        return false;
      }
      return true;
    });
  }, [events, filterMonth, filterDay, filterDate, filterTitle]);

  const handleViewMore = (eventId) => {
    try {
      if (typeof window !== 'undefined') {
        const event = events.find((e) => e.id === eventId);
        if (event) {
          window.localStorage.setItem('selected_event', JSON.stringify(event));
        }
      }
    } catch {}
    router.push(`/particularevent?id=${eventId}`);
  };

  // When admin clicks participant count, navigate to registrations list for that event
  const handleViewRegistrations = (eventId) => {
    router.push(`/admin/registrations/${eventId}`);
  };

  const handleProfileNavigation = async (route) => {
    if (route === '/admin/addnewevent') {
      router.push(route);
      return;
    }
    if (route === '/logout') {
      // Handle logout
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      localStorage.removeItem('role');
      localStorage.removeItem('email');
      router.push('/login');
    } else {
      router.push(route);
    }
  };

  // Global admin-specific profile options
  const getProfileOptions = () => {
    return [
      {
        icon: (
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        ),
        label: 'Home',
        route: '/main/0'
      },
      {
        icon: (
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        ),
        label: 'Add New Event',
        route: '/admin/addnewevent',
        highlight: true
      },
      {
        icon: (
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        ),
        label: 'View All Admins',
        route: '/global_admin/viewall_admins',
        highlight: true
      },
      {
        icon: (
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0v4" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 11h12a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2z" />
          </svg>
        ),
        label: 'Request Access',
        route: '/global_admin/access-requests',
        highlight: true
      },
      {
        icon: (
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        label: 'Help & Support',
        route: '/help'
      }
    ];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-white to-[#EFF6FF] relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Floating Orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-[#3B82F6]/10 to-[#06B6D4]/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-[#06B6D4]/10 to-[#3B82F6]/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-gradient-to-r from-[#3B82F6]/5 to-[#1E40AF]/5 rounded-full blur-3xl animate-pulse delay-500"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23E2E8F0' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>
      </div>

      {/* Header */}
      <header className="w-full px-8 py-6 bg-white/80 backdrop-blur-xl border-b border-[#E2E8F0]/50 shadow-lg relative z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-[#1E40AF]">
              Global Admin Dashboard
            </h1>
            <p className="text-[#64748B] mt-2">Manage and monitor all events</p>
          </div>
          
          {/* Profile Circle */}
          <div className="flex items-center relative" ref={profileRef}>
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-14 h-14 bg-gradient-to-br from-[#3B82F6] to-[#06B6D4] rounded-2xl flex items-center justify-center hover:from-[#1E40AF] hover:to-[#3B82F6] transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
            >
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>

            {/* Profile Dropdown */}
            {isProfileOpen && (
              <div className="absolute top-16 right-0 w-[22rem] bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-[#E2E8F0]/50 z-50 overflow-hidden">
                {/* Header Section */}
                <div className="bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg">{userData.username}</h3>
                      <p className="text-white/80 text-sm">{userData.email}</p>
                    </div>
                  </div>
                </div>

                {/* Menu Options */}
                <div className="p-2">
                  {getProfileOptions().map((option, index) => {
                    const isActive = activeMenu === option.route;
                    return (
                      <button
                        key={index}
                        onClick={() => { setActiveMenu(option.route); handleProfileNavigation(option.route); }}
                        onMouseEnter={() => setActiveMenu((prev) => prev ?? option.route)}
                        onMouseLeave={() => setActiveMenu((prev) => (prev === option.route ? null : prev))}
                        className={`group w-full text-left px-4 py-3 rounded-md transition-all duration-150 flex items-center space-x-3 border-l-4 ${
                          isActive
                            ? 'bg-indigo-50 border-indigo-500'
                            : 'border-transparent hover:bg-indigo-50 hover:border-indigo-400'
                        }`}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        {option.icon}
                        <span className={`font-medium ${isActive ? 'text-indigo-700' : option.highlight ? 'text-blue-700' : 'text-gray-700'} group-hover:text-indigo-700`}>
                          {option.label}
                        </span>
                      </button>
                    );
                  })}

                  <hr className="my-2 border-gray-200" />

                  <button 
                    onClick={() => handleProfileNavigation('/logout')}
                    className="w-full text-left px-4 py-3 hover:bg-red-50 rounded-md transition-colors duration-150 flex items-center space-x-3 text-red-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Global Admin Stats (match admin dashboard) */}
        <section className="mb-8 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          <div className="bg-white/80 backdrop-blur-xl border border-[#E2E8F0]/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#64748B]">Total Events</p>
                <p className="text-3xl font-bold text-[#1E40AF]">{userData.eventsCreated}</p>
              </div>
              <div className="w-12 h-12 bg-[#3B82F6]/10 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-[#3B82F6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-xl border border-[#E2E8F0]/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#64748B]">Total Participants</p>
                <p className="text-3xl font-bold text-[#1E40AF]">{userData.totalParticipants}</p>
              </div>
              <div className="w-12 h-12 bg-[#10B981]/10 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-[#10B981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white/90 backdrop-blur-sm border border-gray-200/60 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Events</p>
                <p className="text-3xl font-bold text-gray-900">{userData.activeEvents}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex itemsCenter justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm border border-gray-200/60 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming Events</p>
                <p className="text-3xl font-bold text-gray-900">{userData.upcomingEvents}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm border border-gray-200/60 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Past Events</p>
                <p className="text-3xl font-bold text-gray-900">{userData.pastEvents}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* Compact Filters */}
        <section className="mb-6 bg-white/80 backdrop-blur-xl border border-[#E2E8F0]/50 rounded-2xl p-6 shadow-lg">
          {/* Header Row */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-[#1E40AF]">Filters</h2>
              <p className="text-sm text-[#64748B]">Refine events by title, month, day, or exact date.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-[#334155] font-medium">Showing {filteredEvents.length} of {events.length}</div>
              {(filterTitle || filterMonth || filterDay || filterDate) && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-[#3B82F6] hover:text-[#1E40AF] bg-[#EFF6FF] hover:bg-[#DBEAFE] px-4 py-2 rounded-xl transition-all duration-300 font-medium"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Controls Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Title */}
            <div className="flex flex-col">
              <label htmlFor="title" className="text-xs font-medium text-gray-900 mb-1">Title</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 inline-flex items-center">
                  <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
                  </svg>
                </span>
                <input
                  id="title"
                  aria-label="Filter by title"
                  type="text"
                  value={filterTitle}
                  onChange={(e) => setFilterTitle(e.target.value)}
                  placeholder="Search title"
                  className="w-full text-sm text-gray-900 rounded-lg border border-gray-200 ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none pl-9 pr-3 py-2 bg-white"
                />
              </div>
            </div>

            {/* Month */}
            <div className="flex flex-col">
              <label htmlFor="month" className="text-xs font-medium text-gray-900 mb-1">Month</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 inline-flex items-center">
                  <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </span>
                <select
                  id="month"
                  aria-label="Filter by month"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="w-full appearance-none text-sm text-gray-900 rounded-lg border border-gray-200 ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none pl-9 pr-8 py-2 bg-white"
                >
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-2 inline-flex items-center">
                  <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </div>
            </div>

            {/* Day of week */}
            <div className="flex flex-col">
              <label htmlFor="day" className="text-xs font-medium text-gray-900 mb-1">Day of week</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 inline-flex items-center">
                  <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
                  </svg>
                </span>
                <select
                  id="day"
                  aria-label="Filter by day of week"
                  value={filterDay}
                  onChange={(e) => setFilterDay(e.target.value)}
                  className="w-full appearance-none text-sm text-gray-900 rounded-lg border border-gray-200 ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none pl-9 pr-8 py-2 bg-white"
                >
                  {days.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-2 inline-flex items-center">
                  <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </div>
            </div>

            {/* Exact date */}
            <div className="flex flex-col">
              <label htmlFor="date" className="text-xs font-medium text-gray-900 mb-1">Exact date</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 inline-flex items-center">
                  <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </span>
                <input
                  id="date"
                  aria-label="Filter by exact date"
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full text-sm text-gray-900 rounded-lg border border-gray-200 ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none pl-9 pr-3 py-2 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Active filter chips */}
          {(() => {
            const active = [];
            if (filterTitle.trim()) active.push({ key: 'title', label: `Title: ${filterTitle.trim()}` });
            if (filterMonth !== '') {
              const label = months.find((m) => m.value === filterMonth)?.label || '';
              active.push({ key: 'month', label: `Month: ${label}` });
            }
            if (filterDay !== '') {
              const label = days.find((d) => d.value === filterDay)?.label || '';
              active.push({ key: 'day', label: `Day: ${label}` });
            }
            if (filterDate) active.push({ key: 'date', label: `Date: ${filterDate}` });

            const clearOne = (key) => {
              if (key === 'title') setFilterTitle('');
              if (key === 'month') setFilterMonth('');
              if (key === 'day') setFilterDay('');
              if (key === 'date') setFilterDate('');
            };

            return active.length ? (
              <div className="flex items-center gap-2 flex-wrap mt-4">
                {active.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => clearOne(f.key)}
                    className="inline-flex items-center gap-2 text-xs text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full"
                  >
                    <span>{f.label}</span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                ))}
              </div>
            ) : null;
          })()}
        </section>

        {/* Events Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading && (
            <div className="col-span-full text-center text-gray-900 bg-white rounded-xl border border-gray-200/60 py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              Loading events...
            </div>
          )}
          
          {error && (
            <div className="col-span-full text-center text-red-600 bg-red-50 rounded-xl border border-red-200 py-10">
              <svg className="w-12 h-12 mx-auto mb-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              {error}
            </div>
          )}
          
          {!loading && !error && filteredEvents.length === 0 && (
            <div className="col-span-full text-center text-gray-900 bg-white rounded-xl border border-gray-200/60 py-10">
              No events found. Try adjusting filters.
            </div>
          )}
          
          {!loading && !error && filteredEvents.map((event) => {
            const eventStatus = getEventStatus(event.start_date, event.end_date);
            const availableSlots = getAvailableSlots(event.registered_no, event.total_participants_allowed);
            
            return (
             <div
               key={event.event_id}
               className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 border border-[#E2E8F0]/30 overflow-hidden relative z-10 hover:border-[#3B82F6]/50 group"
             >
              {/* Event Image */}
              <div className="relative h-56 bg-gradient-to-br from-[#1E40AF] via-[#3B82F6] to-[#06B6D4] overflow-hidden">
                {event.image_url ? (
                  <img 
                    src={event.image_url} 
                    alt={event.event_name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center border border-white/30">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                )}
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                
                {/* Event Status Badge */}
                <div className={`absolute top-4 left-4 backdrop-blur-sm bg-white/90 ${eventStatus.bgColor} ${eventStatus.textColor} ${eventStatus.borderColor} text-xs px-4 py-2 rounded-2xl font-semibold border flex items-center gap-2 shadow-lg`}>
                  {eventStatus.status === 'live' && (
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  )}
                  {eventStatus.status === 'upcoming' && (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                  {eventStatus.status === 'ended' && (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {eventStatus.label}
                </div>
                
                {/* Available slots info */}
                <div className="absolute bottom-4 right-4 backdrop-blur-sm bg-black/40 text-white text-sm px-3 py-2 rounded-2xl font-medium border border-white/20">
                  {event.registered_no || 0}/{event.total_participants_allowed || '∞'} spots
                </div>
                
                {/* Global Admin badge */}
                <div className="absolute top-4 right-4 bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] text-white text-xs px-3 py-2 rounded-2xl font-semibold shadow-lg border border-white/20">
                  Global Admin
                </div>
                
                {/* Decorative Elements */}
                <div className="absolute bottom-4 left-4 w-8 h-8 bg-white/10 rounded-full border border-white/20"></div>
                <div className="absolute top-1/2 right-8 w-6 h-6 bg-white/10 rounded-full border border-white/20"></div>
              </div>

              {/* Event Details */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  {/* Left side - Title and Date */}
                  <div className="flex-1">
                    <h3 className="font-bold text-[#1E40AF] text-xl mb-3 line-clamp-2 group-hover:text-[#3B82F6] transition-colors duration-300">
                      {event.event_name}
                    </h3>
                    <div className="flex items-center text-[#64748B] mb-3">
                      <div className="w-8 h-8 bg-[#3B82F6]/10 rounded-xl flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-[#3B82F6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium">
                        {formatEventDate(event.start_date, 'long')}
                      </span>
                    </div>
                    {/* Participant count for admin view */}
                    <div className="flex items-center text-[#64748B] mb-3">
                      <div className="w-8 h-8 bg-[#10B981]/10 rounded-xl flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-[#10B981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium">{event.registered_no || 0} participants</span>
                    </div>
                  </div>

                  {/* Right side - View More Button */}
                  <button
                    onClick={() => handleViewMore(event.event_id)}
                    className="ml-4 bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] text-white px-6 py-3 rounded-2xl text-sm font-semibold hover:from-[#1E40AF] hover:to-[#3B82F6] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 whitespace-nowrap relative overflow-hidden group/btn"
                  >
                    <span className="relative z-10">Manage</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-[#06B6D4] to-[#3B82F6] opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                  </button>
                </div>

                {/* Event Caption */}
                <p className="text-[#334155] text-sm line-clamp-2 mb-4 leading-relaxed">
                  {event.caption || 'No caption available'}
                </p>
                
                {/* Event Status and Info */}
                <div className="pt-4 border-t border-[#E2E8F0]/50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[#64748B] text-sm font-medium">
                      Ends: {formatEventDate(event.end_date)}
                    </span>
                    <span className={`text-xs font-semibold px-3 py-2 rounded-2xl ${eventStatus.bgColor} ${eventStatus.textColor} ${eventStatus.borderColor} border backdrop-blur-sm`}>
                      {eventStatus.label}
                    </span>
                  </div>
                  
                  {/* Event-specific info */}
                  <div className="flex items-center justify-between text-xs">
                    {eventStatus.status === 'upcoming' && (
                      <>
                        <span className="text-[#64748B] font-medium">
                          Available slots: <span className="text-[#10B981] font-bold">{availableSlots.available}</span>
                        </span>
                        <span className="text-[#10B981] font-bold">
                          {event.total_participants_allowed || '∞'} max capacity
                        </span>
                      </>
                    )}
                    
                    {eventStatus.status === 'live' && (
                      <>
                        <span className="text-[#64748B] font-medium">
                          Event in progress
                        </span>
                        <span className="text-[#10B981] font-bold">
                          {event.registered_no || 0} participants
                        </span>
                      </>
                    )}
                    
                    {eventStatus.status === 'ended' && (
                      <>
                        <span className="text-[#64748B] font-medium">
                          Event completed
                        </span>
                        <span className="text-[#64748B] font-bold">
                          {event.registered_no || 0} total participants
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
           );
          })}
        </div>

        {/* Load More Section */}
        <div className="text-center mt-12">
          <button className="bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] text-white px-8 py-3 rounded-2xl font-semibold hover:from-[#1E40AF] hover:to-[#3B82F6] transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105">
            Load More Events
          </button>
        </div>
      </main>

      {/* Background Decorations */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-[#3B82F6]/20 rounded-full opacity-30 animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-16 h-16 bg-[#06B6D4]/20 rounded-full opacity-30 animate-pulse"></div>
      <div className="absolute top-1/2 right-5 w-12 h-12 bg-[#1E40AF]/20 rounded-full opacity-30 animate-pulse"></div>
      
    </div>

);
}
