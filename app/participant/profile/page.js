'use client';
import { useState } from 'react';

export default function ParticipantProfile() {
  // Sample participant data - replace with real data from your backend
  const [participantData] = useState({
    name: "Jane Smith",
    email: "jane.smith@example.com",
    role: "Event Participant",
    joinDate: "February 2024",
    eventsRegistered: 5,
    eventsAttended: 3,
    eventsWon: 1,
    wishlistCount: 8
  });

  const [stats] = useState([
    { label: "Events Registered", value: 5, icon: "📝", color: "green" },
    { label: "Events Attended", value: 3, icon: "✅", color: "blue" },
    { label: "Events Won", value: 1, icon: "🏆", color: "yellow" },
    { label: "Wishlist Items", value: 8, icon: "❤️", color: "pink" }
  ]);

  const handleNavigation = (route) => {
    console.log('Navigate to:', route);
    // Add your navigation logic here
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="w-full px-6 py-6 bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            My Profile
          </h1>
          <p className="text-gray-600 mt-2">Track your event participation and achievements</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Profile Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-green-500 to-blue-600 p-8">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-white">{participantData.name}</h2>
                <p className="text-white/80 text-lg">{participantData.email}</p>
                <p className="text-white/70">{participantData.role} • Member since {participantData.joinDate}</p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-6 text-center">
                  <div className="text-3xl mb-2">{stat.icon}</div>
                  <div className={`text-2xl font-bold text-${stat.color}-600`}>{stat.value}</div>
                  <div className="text-gray-600 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Registered Events */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-300">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Registered Events</h3>
              <p className="text-gray-600 mb-4">View all events you've registered for</p>
              <button 
                onClick={() => handleNavigation('/participant/registered-events')}
                className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:from-green-600 hover:to-blue-700 transition-all duration-200"
              >
                View Events
              </button>
            </div>
          </div>

          {/* Won Events */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-300">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Won Events</h3>
              <p className="text-gray-600 mb-4">Celebrate your victories and achievements</p>
              <button 
                onClick={() => handleNavigation('/participant/won-events')}
                className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-6 py-3 rounded-xl font-medium hover:from-yellow-600 hover:to-orange-700 transition-all duration-200"
              >
                View Wins
              </button>
            </div>
          </div>

          {/* Wishlist Events */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-300">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Wishlist Events</h3>
              <p className="text-gray-600 mb-4">Events you're interested in attending</p>
              <button 
                onClick={() => handleNavigation('/participant/wishlist-events')}
                className="bg-gradient-to-r from-pink-500 to-red-600 text-white px-6 py-3 rounded-xl font-medium hover:from-pink-600 hover:to-red-700 transition-all duration-200"
              >
                View Wishlist
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">Registered for "Tech Conference 2024"</p>
                <p className="text-gray-600 text-sm">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">Added "Music Festival" to wishlist</p>
                <p className="text-gray-600 text-sm">1 day ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">Won "Photography Contest"</p>
                <p className="text-gray-600 text-sm">3 days ago</p>
              </div>
            </div>
          </div>
        </div>

        {/* Achievements Section */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Achievements</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg p-4 text-white text-center">
              <div className="text-2xl mb-2">🏆</div>
              <div className="font-bold">Event Winner</div>
              <div className="text-sm opacity-80">Won your first event</div>
            </div>
            <div className="bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg p-4 text-white text-center">
              <div className="text-2xl mb-2">🎯</div>
              <div className="font-bold">Active Participant</div>
              <div className="text-sm opacity-80">Registered for 5+ events</div>
            </div>
            <div className="bg-gradient-to-r from-purple-400 to-purple-600 rounded-lg p-4 text-white text-center">
              <div className="text-2xl mb-2">💝</div>
              <div className="font-bold">Event Enthusiast</div>
              <div className="text-sm opacity-80">Added 5+ events to wishlist</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
