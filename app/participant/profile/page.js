'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ParticipantProfile() {
  const router = useRouter();
  // Sample participant data - replace with real data from your backend
  const [participantData, setParticipantData] = useState({
    name: "Jane Smith",
    email: "jane.smith@example.com",
    role: "Event Participant",
    joinDate: "February 2024",
    eventsRegistered: 5,
    eventsAttended: 3,
    eventsWon: 1,
    wishlistCount: 8,
    department: "Computer Science",
    year: "3",
    registerNumber: "REG123456",
    collegeName: "ABC College"
  });

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [draftProfile, setDraftProfile] = useState({
    name: "Jane Smith",
    department: "Computer Science",
    year: "3",
    registerNumber: "REG123456",
    collegeName: "ABC College"
  });

  const startEdit = () => {
    setDraftProfile({
      name: participantData.name || "",
      department: participantData.department || "",
      year: participantData.year || "",
      registerNumber: participantData.registerNumber || "",
      collegeName: participantData.collegeName || ""
    });
    setIsEditingProfile(true);
  };

  const saveProfile = () => {
    setParticipantData((prev) => ({
      ...prev,
      name: draftProfile.name,
      department: draftProfile.department,
      year: draftProfile.year,
      registerNumber: draftProfile.registerNumber,
      collegeName: draftProfile.collegeName
    }));
    setIsEditingProfile(false);
  };

  const cancelEdit = () => {
    setIsEditingProfile(false);
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

  // Stats removed from UI; state removed to keep file lean

  const handleNavigation = (route) => {
    router.push(route);
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
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden mb-8">
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
                  className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-green-600 hover:to-blue-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Save
                </button>
                <button
                  onClick={cancelEdit}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
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
                <label htmlFor="pf-name" className="text-xs font-medium text-gray-900 mb-1">Name</label>
                <input
                  id="pf-name"
                  type="text"
                  value={draftProfile.name}
                  onChange={(e) => setDraftProfile({ ...draftProfile, name: e.target.value })}
                  className="w-full text-sm text-gray-900 rounded-lg border border-gray-200 ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none px-3 py-2 bg-white shadow-sm"
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="pf-dept" className="text-xs font-medium text-gray-900 mb-1">Department</label>
                <input
                  id="pf-dept"
                  type="text"
                  value={draftProfile.department}
                  onChange={(e) => setDraftProfile({ ...draftProfile, department: e.target.value })}
                  className="w-full text-sm text-gray-900 rounded-lg border border-gray-200 ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none px-3 py-2 bg-white shadow-sm"
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="pf-year" className="text-xs font-medium text-gray-900 mb-1">Year</label>
                <input
                  id="pf-year"
                  type="text"
                  value={draftProfile.year}
                  onChange={(e) => setDraftProfile({ ...draftProfile, year: e.target.value })}
                  className="w-full text-sm text-gray-900 rounded-lg border border-gray-200 ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none px-3 py-2 bg-white shadow-sm"
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="pf-reg" className="text-xs font-medium text-gray-900 mb-1">Register Number</label>
                <input
                  id="pf-reg"
                  type="text"
                  value={draftProfile.registerNumber}
                  onChange={(e) => setDraftProfile({ ...draftProfile, registerNumber: e.target.value })}
                  className="w-full text-sm text-gray-900 rounded-lg border border-gray-200 ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none px-3 py-2 bg-white shadow-sm"
                />
              </div>
              <div className="md:col-span-2 flex flex-col">
                <label htmlFor="pf-college" className="text-xs font-medium text-gray-900 mb-1">College Name</label>
                <input
                  id="pf-college"
                  type="text"
                  value={draftProfile.collegeName}
                  onChange={(e) => setDraftProfile({ ...draftProfile, collegeName: e.target.value })}
                  className="w-full text-sm text-gray-900 rounded-lg border border-gray-200 ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none px-3 py-2 bg-white shadow-sm"
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
                <div className="text-sm font-medium text-gray-900">{participantData.department || '-'}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:bg-gray-100 transition-colors">
                <div className="text-xs text-gray-600">Year</div>
                <div className="text-sm font-medium text-gray-900">{participantData.year || '-'}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:bg-gray-100 transition-colors">
                <div className="text-xs text-gray-600">Register Number</div>
                <div className="text-sm font-medium text-gray-900">{participantData.registerNumber || '-'}</div>
              </div>
              <div className="md:col-span-2 bg-gray-50 rounded-lg p-4 border border-gray-200 hover:bg-gray-100 transition-colors">
                <div className="text-xs text-gray-600">College Name</div>
                <div className="text-sm font-medium text-gray-900">{participantData.collegeName || '-'}</div>
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
                onClick={() => handleNavigation('/participant/registered')}
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
                onClick={() => handleNavigation('/participant/winners')}
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
                onClick={() => handleNavigation('/participant/wishlist')}
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
