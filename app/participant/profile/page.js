'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation'; // Added for redirect

import { AuthGuard } from '../../../lib/authGuard';

export default function ParticipantProfile() {
  return (
    <AuthGuard requiredRole="participant">
      <ParticipantProfileContent />
    </AuthGuard>
  );
}

function ParticipantProfileContent() {
  // Profile data state
  const [participantData, setParticipantData] = useState({
    name: "Not added",
    email: "Loading...",
    username: "Loading...",
    role: "Event Participant",
    joinDate: "February 2024",
    eventsRegistered: 0,
    eventsAttended: 0,
    eventsWon: 0,
    wishlistCount: 0,
    department: "Not added",
    year: "Not added",
    registerNumber: "Not added",
    collegeName: "Not added"
  });

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [draftProfile, setDraftProfile] = useState({
    name: "",
    department: "",
    year: "",
    registerNumber: "",
    collegeName: ""
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [countsLoading, setCountsLoading] = useState(false);

  // Get user ID from localStorage (set during login/signup)
  const [userId, setUserId] = useState(null);

  const router = useRouter(); // Initialize useRouter

  // Profile dropdown state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);
  // Track active/hovered menu item for visual highlight
  const [activeMenu, setActiveMenu] = useState(null);

  // Fetch profile data on component mount
  useEffect(() => {
    // Get user ID from localStorage
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
      fetchProfileData(storedUserId);
      fetchEventCounts(storedUserId); // Fetch real-time event counts
    }
  }, []);

  const fetchProfileData = async (id) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`/api/participants/profile?user_id=${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      
      const data = await response.json();
      
      // Update user data (email and username)
      if (data.user) {
        setParticipantData(prev => ({
          ...prev,
          email: data.user.email || "Not available",
          username: data.user.username || "User"
        }));
      }
      
      // Update profile data if it exists
      if (data.profile) {
        setParticipantData(prev => ({
          ...prev,
          name: data.profile.name || "Not added",
          department: data.profile.department || "Not added",
          year: data.profile.year || "Not added",
          registerNumber: data.profile.register_number || "Not added",
          collegeName: data.profile.college_name || "Not added"
        }));
      } else {
        // Profile not found, use default values for profile fields
        setParticipantData(prev => ({
          ...prev,
          name: "Not added",
          department: "Not added",
          year: "Not added",
          registerNumber: "Not added",
          collegeName: "Not added"
        }));
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch real-time event counts
  const fetchEventCounts = async (id) => {
    try {
      setCountsLoading(true);
      
      // Fetch registered events count
      const registeredResponse = await fetch(`/api/participants/registered-events?user_id=${id}`);
      if (registeredResponse.ok) {
        const registeredData = await registeredResponse.json();
        setParticipantData(prev => ({
          ...prev,
          eventsRegistered: registeredData.count || 0
        }));
      }

      // Fetch won events count
      const wonResponse = await fetch(`/api/participants/won-events?user_id=${id}`);
      if (wonResponse.ok) {
        const wonData = await wonResponse.json();
        setParticipantData(prev => ({
          ...prev,
          eventsWon: wonData.count || 0
        }));
      }

      // Fetch wishlisted events count
      const wishlistResponse = await fetch(`/api/participants/wishlisted-events?user_id=${id}`);
      if (wishlistResponse.ok) {
        const wishlistData = await wishlistResponse.json();
        setParticipantData(prev => ({
          ...prev,
          wishlistCount: wishlistData.count || 0
        }));
      }
    } catch (err) {
      console.error('Error fetching event counts:', err);
      // Don't set error here as this is not critical for the main profile display
    } finally {
      setCountsLoading(false);
    }
  };

  const startEdit = () => {
    setDraftProfile({
      name: participantData.name === "Not added" ? "" : participantData.name,
      department: participantData.department === "Not added" ? "" : participantData.department,
      year: participantData.year === "Not added" ? "" : participantData.year,
      registerNumber: participantData.registerNumber === "Not added" ? "" : participantData.registerNumber,
      collegeName: participantData.collegeName === "Not added" ? "" : participantData.collegeName
    });
    setIsEditingProfile(true);
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      setError('');

      // Validate required fields
      if (!draftProfile.name || !draftProfile.department || !draftProfile.year || 
          !draftProfile.registerNumber || !draftProfile.collegeName) {
        setError('All fields are required');
        return;
      }

      // Validate year (1-6)
      const yearNum = parseInt(draftProfile.year);
      if (isNaN(yearNum) || yearNum < 1 || yearNum > 6) {
        setError('Year must be between 1 and 6');
        return;
      }

      const profileData = {
        user_id: userId,
        name: draftProfile.name,
        college_name: draftProfile.collegeName,
        department: draftProfile.department,
        register_number: draftProfile.registerNumber,
        year: yearNum
      };

      const response = await fetch('/api/participants/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save profile');
      }

      const result = await response.json();
      
      // Update local state with new data
      setParticipantData(prev => ({
        ...prev,
        name: result.profile.name,
        department: result.profile.department,
        year: result.profile.year.toString(),
        registerNumber: result.profile.register_number,
        collegeName: result.profile.college_name
      }));

      setIsEditingProfile(false);
      
      // Show success message (you can add a toast notification here)
      console.log(`Profile ${result.action} successfully`);
      
      // If this was a new profile creation, redirect to main page
      if (result.action === 'created') {
        // Redirect to participant main page after successful profile creation
        router.push('/main/2');
      }
      
    } catch (err) {
      console.error('Error saving profile:', err);
      setError(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setIsEditingProfile(false);
    setError('');
  };

  // Badge tiers helper
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

  const handleNavigation = (route) => {
    console.log('Navigate to:', route);
    router.push(route);
  };

  // Refresh event counts
  const refreshEventCounts = () => {
    if (userId) {
      fetchEventCounts(userId);
    }
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

  // Participant-specific profile options
  const getProfileOptions = () => {
    return [
      {
        icon: (
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        ),
        label: 'Home',
        route: '/main/2'
      },
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
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-white to-[#EFF6FF] relative overflow-hidden flex items-center justify-center">
        {/* Animated Background Elements */}
        <div className="fixed inset-0 pointer-events-none">
          {/* Floating Orbs */}
          <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-[#3B82F6]/10 to-[#06B6D4]/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-[#06B6D4]/10 to-[#3B82F6]/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-gradient-to-r from-[#3B82F6]/5 to-[#1E40AF]/5 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
        
        <div className="text-center relative z-10">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] rounded-full flex items-center justify-center animate-pulse">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-[#3B82F6] animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.001 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
            </div>
            <div className="absolute -inset-4 bg-gradient-to-r from-[#3B82F6]/20 to-[#06B6D4]/20 rounded-full blur-2xl animate-pulse"></div>
          </div>
          <p className="text-[#64748B] mt-6 text-lg font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-white to-[#EFF6FF] relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Floating Orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-[#3B82F6]/10 to-[#06B6D4]/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-[#06B6D4]/10 to-[#3B82F6]/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-gradient-to-r from-[#3B82F6]/5 to-[#1E40AF]/5 rounded-full blur-3xl animate-pulse delay-500"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23E2E8F0' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>
      </div>

      {/* Header */}
      <header className="relative z-50 w-full px-8 py-6 bg-white/80 backdrop-blur-xl border-b border-[#E2E8F0]/50 shadow-lg sticky top-0">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-4 group">
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-[#3B82F6] to-[#1E40AF] rounded-2xl flex items-center justify-center shadow-2xl group-hover:shadow-[#3B82F6]/25 transition-all duration-500 transform group-hover:scale-110 group-hover:rotate-3">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="absolute -inset-2 bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
            </div>
            <div>
              <h1 className="text-4xl font-black text-[#1E40AF]">My Profile</h1>
              <p className="text-[#64748B] mt-1 font-medium">Track your event participation and achievements</p>
            </div>
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
                      <h3 className="text-white font-semibold text-lg">{participantData.username}</h3>
                      <p className="text-white/80 text-sm">{participantData.email}</p>
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
                        <span className={`font-medium ${isActive ? 'text-indigo-700' : 'text-gray-700'} group-hover:text-indigo-700`}>
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
      <main className="relative z-10 max-w-7xl mx-auto px-8 py-12">
        {/* Error Message */}
        {error && (
          <div className="mb-8 bg-red-50/80 backdrop-blur-sm border border-red-200/60 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-800">Error</h3>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Profile Section */}
        <div className="bg-white/90 backdrop-blur-xl border border-[#E2E8F0]/50 rounded-3xl shadow-xl overflow-hidden mb-8 relative">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#3B82F6]/10 to-[#06B6D4]/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-[#06B6D4]/10 to-[#3B82F6]/10 rounded-full translate-y-12 -translate-x-12"></div>
          
          <div className="bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] p-8 relative z-10">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center shadow-2xl">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-black text-white mb-2">{participantData.username}</h2>
                <p className="text-white/90 text-lg font-medium mb-1">{participantData.email}</p>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-xl border border-white/30">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-white font-medium">{participantData.role}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

                {/* Profile Details (editable) */}
        <div className="bg-white/90 backdrop-blur-xl border border-[#E2E8F0]/50 rounded-3xl p-8 mb-8 relative overflow-hidden shadow-xl">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#3B82F6]/5 to-[#06B6D4]/5 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-[#06B6D4]/5 to-[#3B82F6]/5 rounded-full translate-y-12 -translate-x-12"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-[#3B82F6] to-[#06B6D4] rounded-2xl flex items-center justify-center shadow-xl">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[#1E40AF]">Personal Information</h3>
                  <p className="text-[#64748B] text-sm">Keep your information up to date and accurate</p>
                </div>
              </div>
              {isEditingProfile ? (
                <div className="flex gap-3">
                  <button
                    onClick={saveProfile}
                    disabled={saving}
                    className="group relative px-6 py-3 bg-gradient-to-r from-[#10B981] to-[#059669] text-white rounded-2xl hover:from-[#059669] hover:to-[#047857] transition-all duration-300 font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      {saving ? (
                        <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.001 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {saving ? 'Saving...' : 'Save Changes'}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-[#059669] to-[#10B981] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </button>
                  <button
                    onClick={cancelEdit}
                    disabled={saving}
                    className="group relative px-6 py-3 bg-gradient-to-r from-[#6B7280] to-[#4B5563] text-white rounded-2xl hover:from-[#4B5563] hover:to-[#374151] transition-all duration-300 font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="relative z-10">Cancel</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-[#4B5563] to-[#6B7280] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </button>
                </div>
              ) : (
                <button
                  onClick={startEdit}
                  className="group relative px-6 py-3 bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] text-white rounded-2xl hover:from-[#1E40AF] hover:to-[#3B82F6] transition-all duration-300 font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Profile
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#06B6D4] to-[#3B82F6] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              )}
            </div>

          {isEditingProfile ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div className="group">
                <label htmlFor="pf-name" className="text-sm font-semibold text-[#1E40AF] mb-3 block flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#3B82F6]/10 rounded-xl flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#3B82F6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  Full Name *
                </label>
                <input
                  id="pf-name"
                  type="text"
                  value={draftProfile.name}
                  onChange={(e) => setDraftProfile({ ...draftProfile, name: e.target.value })}
                  className="w-full text-sm text-[#1E40AF] rounded-2xl border-2 border-[#E2E8F0] focus:border-[#3B82F6] focus:outline-none px-4 py-3 bg-white/80 backdrop-blur-sm shadow-sm transition-all duration-300 group-hover:border-[#3B82F6]/50 focus:shadow-lg"
                  placeholder="Enter your full name"
                />
              </div>
              
              <div className="group">
                <label htmlFor="pf-dept" className="text-sm font-semibold text-[#1E40AF] mb-3 block flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#10B981]/10 rounded-xl flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#10B981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  Department *
                </label>
                <input
                  id="pf-dept"
                  type="text"
                  value={draftProfile.department}
                  onChange={(e) => setDraftProfile({ ...draftProfile, department: e.target.value })}
                  className="w-full text-sm text-[#1E40AF] rounded-2xl border-2 border-[#E2E8F0] focus:border-[#10B981] focus:outline-none px-4 py-3 bg-white/80 backdrop-blur-sm shadow-sm transition-all duration-300 group-hover:border-[#10B981]/50 focus:shadow-lg"
                  placeholder="e.g., Computer Science"
                />
              </div>
              
              <div className="group">
                <label htmlFor="pf-year" className="text-sm font-semibold text-[#1E40AF] mb-3 block flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#8B5CF6]/10 rounded-xl flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#8B5CF6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  Academic Year * (1-6)
                </label>
                <input
                  id="pf-year"
                  type="number"
                  min="1"
                  max="6"
                  value={draftProfile.year}
                  onChange={(e) => setDraftProfile({ ...draftProfile, year: e.target.value })}
                  className="w-full text-sm text-[#1E40AF] rounded-2xl border-2 border-[#E2E8F0] focus:border-[#8B5CF6] focus:outline-none px-4 py-3 bg-white/80 backdrop-blur-sm shadow-sm transition-all duration-300 group-hover:border-[#8B5CF6]/50 focus:shadow-lg"
                  placeholder="1-6"
                />
              </div>
              
              <div className="group">
                <label htmlFor="pf-reg" className="text-sm font-semibold text-[#1E40AF] mb-3 block flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#F59E0B]/10 rounded-xl flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#F59E0B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  Register Number *
                </label>
                <input
                  id="pf-reg"
                  type="text"
                  value={draftProfile.registerNumber}
                  onChange={(e) => setDraftProfile({ ...draftProfile, registerNumber: e.target.value })}
                  className="w-full text-sm text-[#1E40AF] rounded-2xl border-2 border-[#E2E8F0] focus:border-[#F59E0B] focus:outline-none px-4 py-3 bg-white/80 backdrop-blur-sm shadow-sm transition-all duration-300 group-hover:border-[#F59E0B]/50 focus:shadow-lg"
                  placeholder="Enter your register number"
                />
              </div>
              
              <div className="md:col-span-2 group">
                <label htmlFor="pf-college" className="text-sm font-semibold text-[#1E40AF] mb-3 block flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#06B6D4]/10 rounded-xl flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#06B6D4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  College Name *
                </label>
                <input
                  id="pf-college"
                  type="text"
                  value={draftProfile.collegeName}
                  onChange={(e) => setDraftProfile({ ...draftProfile, collegeName: e.target.value })}
                  className="w-full text-sm text-[#1E40AF] rounded-2xl border-2 border-[#E2E8F0] focus:border-[#06B6D4] focus:outline-none px-4 py-3 bg-white/80 backdrop-blur-sm shadow-sm transition-all duration-300 group-hover:border-[#06B6D4]/50 focus:shadow-lg"
                  placeholder="Enter your college name"
                />
              </div>
            </div>
                    ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="group bg-white/90 backdrop-blur-xl border border-[#E2E8F0]/50 rounded-xl p-4 hover:shadow-lg transition-all duration-300 hover:scale-105">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-[#3B82F6]/10 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#3B82F6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Full Name</div>
                </div>
                <div className="text-base font-bold text-[#1E40AF]">{participantData.name}</div>
              </div>
              
              <div className="group bg-white/90 backdrop-blur-xl border border-[#E2E8F0]/50 rounded-xl p-4 hover:shadow-lg transition-all duration-300 hover:scale-105">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-[#3B82F6]/10 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#3B82F6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Department</div>
                </div>
                <div className="text-base font-bold text-[#1E40AF]">{participantData.department}</div>
              </div>
              
              <div className="group bg-white/90 backdrop-blur-xl border border-[#E2E8F0]/50 rounded-xl p-4 hover:shadow-lg transition-all duration-300 hover:scale-105">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-[#3B82F6]/10 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#3B82F6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Academic Year</div>
                </div>
                <div className="text-base font-bold text-[#1E40AF]">{participantData.year}</div>
              </div>
              
              <div className="group bg-white/90 backdrop-blur-xl border border-[#E2E8F0]/50 rounded-xl p-4 hover:shadow-lg transition-all duration-300 hover:scale-105">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-[#3B82F6]/10 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#3B82F6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Register Number</div>
                </div>
                <div className="text-base font-bold text-[#1E40AF]">{participantData.registerNumber}</div>
              </div>
              
              <div className="md:col-span-2 group bg-white/90 backdrop-blur-xl border border-[#E2E8F0]/50 rounded-xl p-4 hover:shadow-lg transition-all duration-300 hover:scale-105">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-[#3B82F6]/10 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#3B82F6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">College Name</div>
                </div>
                <div className="text-base font-bold text-[#1E40AF]">{participantData.collegeName}</div>
              </div>
            </div>
          )}
        </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-[#1E40AF]">Quick Actions</h3>
          <button
            onClick={refreshEventCounts}
            disabled={countsLoading}
            className="group relative px-6 py-3 bg-white/80 backdrop-blur-sm text-[#3B82F6] border-2 border-[#3B82F6] rounded-2xl hover:bg-[#EFF6FF] hover:border-[#1E40AF] transition-all duration-300 font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {countsLoading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            {countsLoading ? 'Refreshing...' : 'Refresh Counts'}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Registered Events */}
          <div className="group bg-white rounded-2xl shadow-lg border border-gray-200/60 p-6 hover:shadow-xl transition-transform duration-300 hover:-translate-y-0.5 ring-1 ring-transparent hover:ring-green-100">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-[#10B981] to-[#06B6D4] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex items-center justify-center gap-2 mb-1">
                {(() => {
                  const t = getTier(participantData.eventsRegistered).current;
                  const name = t?.name || 'None';
                  const pill = tierPillClassMap[name];
                  return (
                    <span className={`text-xs px-2 py-1 rounded-full ${pill}`}>{name}</span>
                  );
                })()}
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800 border border-gray-200">
                  {countsLoading ? (
                    <div className="w-4 h-4 border border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto"></div>
                  ) : (
                    participantData.eventsRegistered
                  )}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 text-center mb-2">Registered Events</h3>
              <p className="text-gray-600 mb-4">View all events you&apos;ve registered for</p>
              <button 
                onClick={() => handleNavigation('/participant/registered')}
                className="bg-gradient-to-r from-[#10B981] to-[#06B6D4] text-white px-6 py-3 rounded-xl font-medium hover:from-[#059669] hover:to-[#3B82F6] transition-all duration-200 shadow group-hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                View Events ({countsLoading ? '...' : participantData.eventsRegistered})
              </button>
            </div>
          </div>

          {/* Won Events */}
          <div className="group bg-white rounded-2xl shadow-lg border border-gray-200/60 p-6 hover:shadow-xl transition-transform duration-300 hover:-translate-y-0.5 ring-1 ring-transparent hover:ring-yellow-100">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div className="flex items-center justify-center gap-2 mb-1">
                {(() => {
                  const t = getTier(participantData.eventsWon).current;
                  const name = t?.name || 'None';
                  const pill = tierPillClassMap[name];
                  return (
                    <span className={`text-xs px-2 py-1 rounded-full ${pill}`}>{name}</span>
                  );
                })()}
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800 border border-gray-200">
                  {countsLoading ? (
                    <div className="w-4 h-4 border border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto"></div>
                  ) : (
                    participantData.eventsWon
                  )}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 text-center mb-2">Won Events</h3>
              <p className="text-gray-600 mb-4">Celebrate your victories and achievements</p>
              <button 
                onClick={() => handleNavigation('/participant/winners')}
                className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-6 py-3 rounded-xl font-medium hover:from-yellow-600 hover:to-orange-700 transition-all duration-200 shadow group-hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                View Wins ({countsLoading ? '...' : participantData.eventsWon})
              </button>
            </div>
          </div>

          {/* Wishlist Events */}
          <div className="group bg-white rounded-2xl shadow-lg border border-gray-200/60 p-6 hover:shadow-xl transition-transform duration-300 hover:-translate-y-0.5 ring-1 ring-transparent hover:ring-pink-100">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div className="flex items-center justify-center gap-2 mb-1">
                {(() => {
                  const t = getTier(participantData.wishlistCount).current;
                  const name = t?.name || 'None';
                  const pill = tierPillClassMap[name];
                  return (
                    <span className={`text-xs px-2 py-1 rounded-full ${pill}`}>{name}</span>
                  );
                })()}
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800 border border-gray-200">
                  {countsLoading ? (
                    <div className="w-4 h-4 border border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto"></div>
                  ) : (
                    participantData.wishlistCount
                  )}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 text-center mb-2">Wishlist Events</h3>
              <p className="text-gray-600 mb-4">Events you&apos;re interested in attending</p>
              <button 
                onClick={() => handleNavigation('/participant/wishlist')}
                className="bg-gradient-to-r from-pink-500 to-red-600 text-white px-6 py-3 rounded-xl font-medium hover:from-pink-600 hover:to-red-700 transition-all duration-200 shadow group-hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
              >
                View Wishlist ({countsLoading ? '...' : participantData.wishlistCount})
              </button>
            </div>
          </div>
        </div>

        {/* Achievements Section with badge tiers */}
        <div className="mt-10 bg-white rounded-2xl shadow-lg border border-gray-200/60 p-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Achievements</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Registered count badge */}
            {(() => {
              const { current, next } = getTier(participantData.eventsRegistered);
              const gradient = current ? current.gradient : 'from-gray-300 to-gray-400';
              const title = current ? `${current.name} Badge` : 'No Badge Yet';
              const subtitle = next
                ? `Register ${next.min - participantData.eventsRegistered} more to reach ${next.name}`
                : 'Top tier achieved!';
              return (
                <div className={`bg-gradient-to-r ${gradient} rounded-lg p-4 text-white text-center shadow-sm ring-1 ring-white/10`}>
                  <div className="text-2xl mb-2">🎯</div>
                  <div className="font-bold">{title}</div>
                  <div className="text-sm opacity-90">Registered events: {participantData.eventsRegistered}</div>
                  <div className="text-xs opacity-80">{subtitle}</div>
                </div>
              );
            })()}

            {/* Wins badge */}
            {(() => {
              const { current, next } = getTier(participantData.eventsWon);
              const gradient = current ? current.gradient : 'from-gray-300 to-gray-400';
              const title = current ? `${current.name} Winner` : 'Keep Winning';
              const subtitle = next
                ? `Win ${next.min - participantData.eventsWon} more to reach ${next.name}`
                : 'Top tier achieved!';
              return (
                <div className={`bg-gradient-to-r ${gradient} rounded-lg p-4 text-white text-center shadow-sm ring-1 ring-white/10`}>
                  <div className="text-2xl mb-2">🏆</div>
                  <div className="font-bold">{title}</div>
                  <div className="text-sm opacity-90">Events won: {participantData.eventsWon}</div>
                  <div className="text-xs opacity-80">{subtitle}</div>
                </div>
              );
            })()}

            {/* Wishlist badge */}
            {(() => {
              const { current, next } = getTier(participantData.wishlistCount);
              const gradient = current ? current.gradient : 'from-gray-300 to-gray-400';
              const title = current ? `${current.name} Enthusiast` : 'Start Exploring';
              const subtitle = next
                ? `Add ${next.min - participantData.wishlistCount} more to reach ${next.name}`
                : 'Top tier achieved!';
              return (
                <div className={`bg-gradient-to-r ${gradient} rounded-lg p-4 text-white text-center shadow-sm ring-1 ring-white/10`}>
                  <div className="text-2xl mb-2">💝</div>
                  <div className="font-bold">{title}</div>
                  <div className="text-sm opacity-90">Wishlist items: {participantData.wishlistCount}</div>
                  <div className="text-xs opacity-80">{subtitle}</div>
                </div>
              );
            })()}
          </div>
        </div>
      </main>
    </div>
  );
}
