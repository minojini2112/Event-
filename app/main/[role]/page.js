'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function MainPage() {
  const router = useRouter();
  const routeParams = useParams();
  const roleParamRaw = routeParams?.role;
  const roleParam = Array.isArray(roleParamRaw) ? roleParamRaw[0] : roleParamRaw;
  const userType = roleParam === '1' ? 'admin' : 'participant';

  // Profile dropdown state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);
  // Track active/hovered menu item for visual highlight
  const [activeMenu, setActiveMenu] = useState(null);

  // Sample user data - replace with real user data
  const userData = {
    username: 'John Doe',
    email: 'john.doe@example.com',
    userType,
    // Sample progress counts; replace with real values from backend
    eventsRegistered: 7,
    eventsWon: 2,
    wishlistCount: 9
  };

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

  // Sample event data - you can replace this with real data from your backend
  const initialSampleEvents = [
    {
      id: 1,
      title: 'Tech Conference 2024',
      date: 'March 15, 2024',
      image: '/api/placeholder/300/200',
      description: 'Join us for the biggest tech conference of the year'
    },
    {
      id: 2,
      title: 'Music Festival',
      date: 'April 20, 2024',
      image: '/api/placeholder/300/200',
      description: 'Three days of amazing music and entertainment'
    },
    {
      id: 3,
      title: 'Food & Wine Expo',
      date: 'May 8, 2024',
      image: '/api/placeholder/300/200',
      description: 'Taste the finest cuisine from around the world'
    },
    {
      id: 4,
      title: 'Art Gallery Opening',
      date: 'June 12, 2024',
      image: '/api/placeholder/300/200',
      description: 'Contemporary art exhibition featuring local artists'
    },
    {
      id: 5,
      title: 'Business Summit',
      date: 'July 5, 2024',
      image: '/api/placeholder/300/200',
      description: 'Network with industry leaders and entrepreneurs'
    },
    {
      id: 6,
      title: 'Sports Championship',
      date: 'August 18, 2024',
      image: '/api/placeholder/300/200',
      description: 'Watch the best athletes compete for the title'
    },
    {
      id: 7,
      title: 'Science Fair',
      date: 'September 22, 2024',
      image: '/api/placeholder/300/200',
      description: 'Discover innovative scientific breakthroughs'
    },
    {
      id: 8,
      title: 'Cultural Festival',
      date: 'October 10, 2024',
      image: '/api/placeholder/300/200',
      description: 'Celebrate diversity through music, dance, and food'
    }
  ];

  // Merge posted events from localStorage so both roles see them
  const [events, setEvents] = useState(initialSampleEvents);
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const stored = window.localStorage.getItem('posted_events');
      if (!stored) return;
      const posted = JSON.parse(stored);
      if (!Array.isArray(posted)) return;
      // Prevent duplicates by id
      const existingIds = new Set(initialSampleEvents.map((e) => e.id));
      const merged = [...initialSampleEvents, ...posted.filter((e) => !existingIds.has(e.id))];
      setEvents(merged);
    } catch (e) {
      console.error('Failed to load posted events:', e);
    }
  }, [initialSampleEvents]);

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

  // Badge tiers (same logic as participant profile)
  const tiers = [
    { name: 'Bronze', min: 5, gradient: 'from-amber-500 to-amber-700' },
    { name: 'Silver', min: 10, gradient: 'from-gray-400 to-gray-600' },
    { name: 'Gold', min: 20, gradient: 'from-yellow-500 to-yellow-700' },
    { name: 'Platinum', min: 40, gradient: 'from-indigo-500 to-purple-600' }
  ];

  const getTier = (count) => {
    let current = null;
    for (const t of tiers) {
      if (count >= t.min) current = t;
    }
    const next = tiers.find((t) => count < t.min) || null;
    const locked = count < tiers[0].min;
    return { current, next, locked };
  };

  const tierPillClassMap = {
    Bronze: 'bg-amber-100 text-amber-800 border border-amber-200',
    Silver: 'bg-gray-100 text-gray-800 border border-gray-300',
    Gold: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    Platinum: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
    None: 'bg-gray-100 text-gray-700 border border-gray-200'
  };

  // Compute filtered events
  const filteredEvents = useMemo(() => {
    const selectedDateObj = parseLocalYmd(filterDate);
    return events.filter((event) => {
      const eventDate = new Date(event.date);
      if (Number.isNaN(eventDate.getTime())) return false;

      if (filterTitle.trim()) {
        const hay = `${event.title}`.toLowerCase();
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
    router.push(route);
  };

  // Dynamic profile options based on user type
  const getProfileOptions = () => {
    const baseParticipantOptions = [
      {
        icon: (
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        ),
        label: 'My Profile',
        route: '/participant/profile'
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
    const baseAdminOptions = [
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

    // Admin-specific options
    if (userData.userType === 'admin') {
      return [
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
        ...baseAdminOptions
      ];
    }

    // Participant-specific options: keep the menu minimal; badges are shown above
    return [...baseParticipantOptions];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="w-full px-6 py-6 bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-sm relative z-[10000]">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Discover Events
            </h1>
            <p className="text-gray-600 mt-2">Find and join amazing events happening around you</p>
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
                    </div>
                  </div>
                </div>

                {/* Participant Badges Summary */}
                {userData.userType === 'participant' && (
                  <div className="px-4 py-3 border-b border-gray-200 bg-white/80">
                    <div className="text-xs font-semibold text-gray-700 mb-2">Badges</div>
                    <div className="space-y-2">
                      {/* Registered */}
                      {(() => {
                        const t = getTier(userData.eventsRegistered).current;
                        const name = t?.name || 'None';
                        const pill = tierPillClassMap[name];
                        return (
                          <div className="flex items-center justify-between bg-gray-50 rounded-md px-3 py-2">
                            <div className="flex items-center gap-2 text-gray-800">
                              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                              <span className="text-xs">Registered</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${pill}`}>{name}</span>
                              <span className="text-xs text-gray-700">{userData.eventsRegistered}</span>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Wins */}
                      {(() => {
                        const t = getTier(userData.eventsWon).current;
                        const name = t?.name || 'None';
                        const pill = tierPillClassMap[name];
                        return (
                          <div className="flex items-center justify-between bg-gray-50 rounded-md px-3 py-2">
                            <div className="flex items-center gap-2 text-gray-800">
                              <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>
                              <span className="text-xs">Wins</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${pill}`}>{name}</span>
                              <span className="text-xs text-gray-700">{userData.eventsWon}</span>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Wishlist */}
                      {(() => {
                        const t = getTier(userData.wishlistCount).current;
                        const name = t?.name || 'None';
                        const pill = tierPillClassMap[name];
                        return (
                          <div className="flex items-center justify-between bg-gray-50 rounded-md px-3 py-2">
                            <div className="flex items-center gap-2 text-gray-800">
                              <svg className="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                              <span className="text-xs">Wishlist</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${pill}`}>{name}</span>
                              <span className="text-xs text-gray-700">{userData.wishlistCount}</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7h18M3 12h18M3 17h18" />
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
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
          {filteredEvents.length === 0 && (
            <div className="col-span-full text-center text-gray-900 bg-white rounded-xl border border-gray-200/60 py-10">
              No events found. Try adjusting filters.
            </div>
          )}
          {filteredEvents.map((event) => (
             <div
               key={event.id}
               className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border border-gray-200/50 overflow-hidden relative z-10"
             >
              {/* Event Image */}
              <div className="relative h-48 bg-gradient-to-br from-blue-100 to-purple-100 overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                {/* Placeholder for actual image */}
                <div className="absolute bottom-2 right-2 bg-black/20 text-white text-xs px-2 py-1 rounded">
                  Event Image
                </div>
              </div>

              {/* Event Details */}
              <div className="p-4">
                <div className="flex justify-between items-start">
                  {/* Left side - Title and Date */}
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2">
                      {event.title}
                    </h3>
                    <div className="flex items-center text-gray-900 mb-3">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm">{event.date}</span>
                    </div>
                  </div>

                  {/* Right side - View More Button */}
                  <button
                    onClick={() => handleViewMore(event.id)}
                    className="ml-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 whitespace-nowrap"
                  >
                    View More
                  </button>
                </div>

                {/* Event Description */}
                <p className="text-gray-900 text-sm line-clamp-2 mt-2">
                  {event.description}
                </p>
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


