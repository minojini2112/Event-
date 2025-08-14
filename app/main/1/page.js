'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

import { AuthGuard } from '../../../lib/authGuard';

export default function AdminMainPage() {
  return (
    <AuthGuard requiredRole="admin">
      <AdminMainPageContent />
    </AuthGuard>
  );
}

function AdminMainPageContent() {
  const router = useRouter();
  // Profile dropdown state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);
  // Track active/hovered menu item for visual highlight
  const [activeMenu, setActiveMenu] = useState(null);

  // User data from localStorage
  const [userData, setUserData] = useState({
    username: 'Loading...',
    email: 'Loading...',
    userType: 'admin',
    eventsCreated: 0,
    totalParticipants: 0,
    activeEvents: 0
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

  const handleProfileNavigation = (route) => {
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

  // Admin-specific profile options
  const getProfileOptions = () => {
    return [
      {
        icon: (
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        ),
        label: 'Home',
        route: '/main/1'
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
        label: 'My Posted Events',
        route: '/admin/postedevent',
        highlight: true
      },
      {
        icon: (
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        ),
        label: 'My Profile',
        route: '/admin/profile'
      },
      {
        icon: (
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
        label: 'Settings',
        route: '/settings'
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="w-full px-6 py-6 bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-sm relative z-[10000]">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-2">Manage and monitor your events</p>
          </div>
          
          {/* Profile Circle */}
          <div className="flex items-center relative" ref={profileRef}>
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>

            {/* Profile Dropdown */}
            {isProfileOpen && (
              <div className="absolute top-14 right-0 w-[22rem] bg-white/95 backdrop-blur rounded-xl shadow-xl ring-1 ring-gray-200 z:[99999] overflow-hidden">
                {/* Header Section */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg">{userData.username}</h3>
                      <p className="text-white/80 text-sm">{userData.email}</p>
                      <div className="mt-2 flex items-center gap-4 text-white/90 text-sm">
                        <span>Events: {userData.eventsCreated}</span>
                        <span>Participants: {userData.totalParticipants}</span>
                      </div>
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
        {/* Admin Stats */}
        <section className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/90 backdrop-blur-sm border border-gray-200/60 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Events</p>
                <p className="text-3xl font-bold text-gray-900">{userData.eventsCreated}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white/90 backdrop-blur-sm border border-gray-200/60 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Participants</p>
                <p className="text-3xl font-bold text-gray-900">{userData.totalParticipants}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* Compact Filters */}
        <section className="mb-6 bg-white/90 backdrop-blur-sm border border-gray-200/60 rounded-xl p-5 shadow-sm">
          {/* Header Row */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Filters</h2>
              <p className="text-xs text-gray-700">Refine events by title, month, day, or exact date.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs text-gray-900">Showing {filteredEvents.length} of {events.length}</div>
              {(filterTitle || filterMonth || filterDay || filterDate) && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg"
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
          
          {!loading && !error && filteredEvents.map((event) => (
             <div
               key={event.event_id}
               className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border border-gray-200/50 overflow-hidden relative z-10"
             >
              {/* Event Image */}
              <div className="relative h-48 bg-gradient-to-br from-blue-100 to-purple-100 overflow-hidden">
                {event.image_url ? (
                  <img 
                    src={event.image_url} 
                    alt={event.event_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                )}
                {/* Event status info */}
                <div className="absolute bottom-2 right-2 bg-black/20 text-white text-xs px-2 py-1 rounded">
                  {event.registered_no || 0}/{event.total_participants_allowed || '∞'} spots
                </div>
                {/* Admin badge */}
                <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                  Admin
                </div>
              </div>

              {/* Event Details */}
              <div className="p-4">
                <div className="flex justify-between items-start">
                  {/* Left side - Title and Date */}
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2">
                      {event.event_name}
                    </h3>
                    <div className="flex items-center text-gray-900 mb-3">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm">
                        {new Date(event.start_date).toLocaleDateString('en-US', { 
                          month: 'long', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </span>
                    </div>
                    {/* Participant count for admin view */}
                    <div className="flex items-center text-gray-600 mb-2">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span className="text-sm">{event.registered_no || 0} participants</span>
                    </div>
                  </div>

                  {/* Right side - View More Button */}
                  <button
                    onClick={() => handleViewMore(event.event_id)}
                    className="ml-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 whitespace-nowrap"
                  >
                    Manage
                  </button>
                </div>

                {/* Event Caption */}
                <p className="text-gray-900 text-sm line-clamp-2 mt-2">
                  {event.caption || 'No caption available'}
                </p>
                
                {/* Additional event info for admin */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>Ends: {new Date(event.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    <span className="text-green-600 font-medium">
                      {event.total_participants_allowed || '∞'} max capacity
                    </span>
                  </div>
                </div>
              </div>
            </div>
           ))}
        </div>

        {/* Load More Section */}
        <div className="text-center mt-12">
          <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]">
            Load More Events
          </button>
        </div>
      </main>

      {/* Background Decorations */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-16 h-16 bg-purple-200 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute top-1/2 right-5 w-12 h-12 bg-pink-200 rounded-full opacity-20 animate-pulse"></div>
    </div>
  );
}
