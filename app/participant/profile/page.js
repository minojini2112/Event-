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
          collegeName: data.profile.college_name || "Not added",
          eventsRegistered: data.profile.registered_events_count || 0,
          eventsWon: data.profile.won_events_count || 0,
          wishlistCount: data.profile.wishlisted_events_count || 0
        }));
      } else {
        // Profile not found, use default values for profile fields
        setParticipantData(prev => ({
          ...prev,
          name: "Not added",
          department: "Not added",
          year: "Not added",
          registerNumber: "Not added",
          collegeName: "Not added",
          eventsRegistered: 0,
          eventsWon: 0,
          wishlistCount: 0
        }));
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile data. Please try again later.');
    } finally {
      setLoading(false);
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
    // Add your navigation logic here
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="w-full px-6 py-6 bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            My Profile
          </h1>
          <p className="text-gray-600 mt-2">Track your event participation and achievements</p>
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
              <div className="absolute top-14 right-0 w-[22rem] bg-white/95 backdrop-blur rounded-xl shadow-xl ring-1 ring-gray-200 z-[99999] overflow-hidden">
                {/* Header Section */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
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

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Profile Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-green-500 to-blue-600 p-8">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-white">{participantData.username}</h2>
                <p className="text-white/80 text-lg">{participantData.email}</p>
                <p className="text-white/70">{participantData.role}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details (editable) */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 p-6 mb-10">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Profile Details</h3>
              <p className="text-gray-600 text-sm">Keep your information up to date</p>
            </div>
            {isEditingProfile ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-green-600 hover:to-blue-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={cancelEdit}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={startEdit}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
              >
                Edit
              </button>
            )}
          </div>

          {isEditingProfile ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="flex flex-col">
                <label htmlFor="pf-name" className="text-xs font-medium text-gray-900 mb-1">Name *</label>
                <input
                  id="pf-name"
                  type="text"
                  value={draftProfile.name}
                  onChange={(e) => setDraftProfile({ ...draftProfile, name: e.target.value })}
                  className="w-full text-sm text-gray-900 rounded-lg border border-gray-200 ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none px-3 py-2 bg-white shadow-sm"
                  placeholder="Enter your full name"
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="pf-dept" className="text-xs font-medium text-gray-900 mb-1">Department *</label>
                <input
                  id="pf-dept"
                  type="text"
                  value={draftProfile.department}
                  onChange={(e) => setDraftProfile({ ...draftProfile, department: e.target.value })}
                  className="w-full text-sm text-gray-900 rounded-lg border border-gray-200 ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none px-3 py-2 bg-white shadow-sm"
                  placeholder="e.g., Computer Science"
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="pf-year" className="text-xs font-medium text-gray-900 mb-1">Year * (1-6)</label>
                <input
                  id="pf-year"
                  type="number"
                  min="1"
                  max="6"
                  value={draftProfile.year}
                  onChange={(e) => setDraftProfile({ ...draftProfile, year: e.target.value })}
                  className="w-full text-sm text-gray-900 rounded-lg border border-gray-200 ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none px-3 py-2 bg-white shadow-sm"
                  placeholder="1-6"
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="pf-reg" className="text-xs font-medium text-gray-900 mb-1">Register Number *</label>
                <input
                  id="pf-reg"
                  type="text"
                  value={draftProfile.registerNumber}
                  onChange={(e) => setDraftProfile({ ...draftProfile, registerNumber: e.target.value })}
                  className="w-full text-sm text-gray-900 rounded-lg border border-gray-200 ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none px-3 py-2 bg-white shadow-sm"
                  placeholder="Enter your register number"
                />
              </div>
              <div className="md:col-span-2 flex flex-col">
                <label htmlFor="pf-college" className="text-xs font-medium text-gray-900 mb-1">College Name *</label>
                <input
                  id="pf-college"
                  type="text"
                  value={draftProfile.collegeName}
                  onChange={(e) => setDraftProfile({ ...draftProfile, collegeName: e.target.value })}
                  className="w-full text-sm text-gray-900 rounded-lg border border-gray-200 ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none px-3 py-2 bg-white shadow-sm"
                  placeholder="Enter your college name"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:bg-gray-100 transition-colors">
                <div className="text-xs text-gray-600">Name</div>
                <div className="text-sm font-medium text-gray-900">{participantData.name}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:bg-gray-100 transition-colors">
                <div className="text-xs text-gray-600">Department</div>
                <div className="text-sm font-medium text-gray-900">{participantData.department}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:bg-gray-100 transition-colors">
                <div className="text-xs text-gray-600">Year</div>
                <div className="text-sm font-medium text-gray-900">{participantData.year}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:bg-gray-100 transition-colors">
                <div className="text-xs text-gray-600">Register Number</div>
                <div className="text-sm font-medium text-gray-900">{participantData.registerNumber}</div>
              </div>
              <div className="md:col-span-2 bg-gray-50 rounded-lg p-4 border border-gray-200 hover:bg-gray-100 transition-colors">
                <div className="text-xs text-gray-600">College Name</div>
                <div className="text-sm font-medium text-gray-900">{participantData.collegeName}</div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mb-3">
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Registered Events */}
          <div className="group bg-white rounded-2xl shadow-lg border border-gray-200/60 p-6 hover:shadow-xl transition-transform duration-300 hover:-translate-y-0.5 ring-1 ring-transparent hover:ring-blue-100">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
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
                  {participantData.eventsRegistered}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 text-center mb-2">Registered Events</h3>
              <p className="text-gray-600 mb-4">View all events you&apos;ve registered for</p>
              <button 
                onClick={() => handleNavigation('/participant/registered-events')}
                className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:from-green-600 hover:to-blue-700 transition-all duration-200 shadow group-hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                View Events ({participantData.eventsRegistered})
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
                  {participantData.eventsWon}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 text-center mb-2">Won Events</h3>
              <p className="text-gray-600 mb-4">Celebrate your victories and achievements</p>
              <button 
                onClick={() => handleNavigation('/participant/won-events')}
                className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-6 py-3 rounded-xl font-medium hover:from-yellow-600 hover:to-orange-700 transition-all duration-200 shadow group-hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                View Wins ({participantData.eventsWon})
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
                  {participantData.wishlistCount}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 text-center mb-2">Wishlist Events</h3>
              <p className="text-gray-600 mb-4">Events you&apos;re interested in attending</p>
              <button 
                onClick={() => handleNavigation('/participant/wishlist-events')}
                className="bg-gradient-to-r from-pink-500 to-red-600 text-white px-6 py-3 rounded-xl font-medium hover:from-pink-600 hover:to-red-700 transition-all duration-200 shadow group-hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
              >
                View Wishlist ({participantData.wishlistCount})
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
