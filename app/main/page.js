'use client';
import { useState, useRef, useEffect } from 'react';

export default function MainPage() {
  // Profile dropdown state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Sample user data - replace with real user data
  const userData = {
    username: "John Doe",
    email: "john.doe@example.com",
    userType: "admin" // or "participant" - this should come from your auth system
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
  const [events] = useState([
    {
      id: 1,
      title: "Tech Conference 2024",
      date: "March 15, 2024",
      image: "/api/placeholder/300/200",
      description: "Join us for the biggest tech conference of the year"
    },
    {
      id: 2,
      title: "Music Festival",
      date: "April 20, 2024",
      image: "/api/placeholder/300/200",
      description: "Three days of amazing music and entertainment"
    },
    {
      id: 3,
      title: "Food & Wine Expo",
      date: "May 8, 2024",
      image: "/api/placeholder/300/200",
      description: "Taste the finest cuisine from around the world"
    },
    {
      id: 4,
      title: "Art Gallery Opening",
      date: "June 12, 2024",
      image: "/api/placeholder/300/200",
      description: "Contemporary art exhibition featuring local artists"
    },
    {
      id: 5,
      title: "Business Summit",
      date: "July 5, 2024",
      image: "/api/placeholder/300/200",
      description: "Network with industry leaders and entrepreneurs"
    },
    {
      id: 6,
      title: "Sports Championship",
      date: "August 18, 2024",
      image: "/api/placeholder/300/200",
      description: "Watch the best athletes compete for the title"
    },
    {
      id: 7,
      title: "Science Fair",
      date: "September 22, 2024",
      image: "/api/placeholder/300/200",
      description: "Discover innovative scientific breakthroughs"
    },
    {
      id: 8,
      title: "Cultural Festival",
      date: "October 10, 2024",
      image: "/api/placeholder/300/200",
      description: "Celebrate diversity through music, dance, and food"
    }
  ]);

  const handleViewMore = (eventId) => {
    console.log('View more clicked for event:', eventId);
    // Add navigation or modal logic here
  };

  const handleProfileNavigation = (route) => {
    console.log('Navigate to:', route);
    // Add your navigation logic here (e.g., using Next.js router)
    // router.push(route);
  };

  // Dynamic profile options based on user type
  const getProfileOptions = () => {
    const baseOptions = [
      {
        icon: (
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        ),
        label: "My Profile",
        route: userData.userType === "admin" ? "/admin/profile" : "/participant/profile"
      },
      {
        icon: (
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
        label: "Settings",
        route: "/settings"
      },
      {
        icon: (
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        label: "Help & Support",
        route: "/help"
      }
    ];

    // Admin-specific options
    if (userData.userType === "admin") {
      return [
        {
          icon: (
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          ),
          label: "Add New Event",
          route: "/admin/add-event",
          highlight: true
        },
        {
          icon: (
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          ),
          label: "My Posted Events",
          route: "/admin/my-events",
          highlight: true
        },
        ...baseOptions
      ];
    }

    // Participant-specific options
    return [
      {
        icon: (
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        label: "Registered Events",
        route: "/participant/registered-events",
        highlight: true
      },
      {
        icon: (
          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        ),
        label: "Won Events",
        route: "/participant/won-events",
        highlight: true
      },
      {
        icon: (
          <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        ),
        label: "Wishlist Events",
        route: "/participant/wishlist-events",
        highlight: true
      },
      ...baseOptions
    ];
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
               <div className="absolute top-16 right-0 w-80 bg-white rounded-lg shadow-2xl border border-gray-200/50 z-[99999] overflow-hidden">
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

                                 {/* Menu Options */}
                 <div className="p-2">
                   {getProfileOptions().map((option, index) => (
                     <button
                       key={index}
                       onClick={() => handleProfileNavigation(option.route)}
                       className={`w-full text-left px-4 py-3 rounded-md transition-colors duration-150 flex items-center space-x-3 ${
                         option.highlight 
                           ? 'hover:bg-blue-50 border-l-4 border-blue-500 bg-blue-50/50' 
                           : 'hover:bg-gray-50'
                       }`}
                     >
                       {option.icon}
                       <span className={option.highlight ? 'text-blue-700 font-medium' : 'text-gray-700'}>
                         {option.label}
                       </span>
                     </button>
                   ))}

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
                 {/* Events Grid */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
           {events.map((event) => (
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
                    <h3 className="font-bold text-gray-800 text-lg mb-2 line-clamp-2">
                      {event.title}
                    </h3>
                    <div className="flex items-center text-gray-600 mb-3">
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
                <p className="text-gray-600 text-sm line-clamp-2 mt-2">
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
