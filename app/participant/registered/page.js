'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ParticipantRegisteredPage() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRegisteredEvents = async () => {
      try {
        setLoading(true);
        setError('');
        
        const userId = localStorage.getItem('userId');
        if (!userId) {
          setError('Please log in to view your registered events');
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/participants/registered-events?user_id=${userId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch registered events');
        }
        
        const data = await response.json();
        if (data.success) {
          setEvents(data.events || []);
        } else {
          throw new Error(data.error || 'Failed to fetch events');
        }
      } catch (err) {
        console.error('Error fetching registered events:', err);
        setError(err.message || 'Failed to load registered events');
      } finally {
        setLoading(false);
      }
    };

    fetchRegisteredEvents();
  }, []);

  const formatYmd = (ymd) => {
    if (!ymd) return '-';
    const [y, m, d] = String(ymd).split('-').map(Number);
    const date = new Date(y, (m || 1) - 1, d || 1);
    if (Number.isNaN(date.getTime())) return String(ymd);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const tiers = [
    { key: 'bronze', label: 'Bronze', min: 5, classes: 'bg-gradient-to-br from-amber-100 to-orange-200 text-amber-800 border-amber-300', cardBg: 'from-amber-50 to-orange-100', iconText: 'text-amber-800', icon: 'M12 2l2.39 4.84 5.34.78-3.86 3.76.91 5.32L12 14.77 6.22 16.7l.91-5.32L3.27 7.62l5.34-.78L12 2z' },
    { key: 'silver', label: 'Silver', min: 10, classes: 'bg-gradient-to-br from-slate-100 to-gray-200 text-slate-700 border-slate-300', cardBg: 'from-slate-50 to-gray-100', iconText: 'text-slate-700', icon: 'M12 2l2.39 4.84 5.34.78-3.86 3.76.91 5.32L12 14.77 6.22 16.7l.91-5.32L3.27 7.62l5.34-.78L12 2z' },
    { key: 'gold', label: 'Gold', min: 20, classes: 'bg-gradient-to-br from-yellow-100 to-amber-200 text-yellow-700 border-yellow-300', cardBg: 'from-yellow-50 to-amber-100', iconText: 'text-yellow-700', icon: 'M12 2l2.39 4.84 5.34.78-3.86 3.76.91 5.32L12 14.77 6.22 16.7l.91-5.32L3.27 7.62l5.34-.78L12 2z' },
    { key: 'platinum', label: 'Platinum', min: 40, classes: 'bg-gradient-to-br from-purple-100 to-indigo-200 text-purple-700 border-purple-300', cardBg: 'from-purple-50 to-indigo-100', iconText: 'text-purple-700', icon: 'M12 2l2.39 4.84 5.34.78-3.86 3.76.91 5.32L12 14.77 6.22 16.7l.91-5.32L3.27 7.62l5.34-.78L12 2z' }
  ];
  const totalRegistrations = events.length;
  const currentBadge = tiers.reduce((acc, t) => (totalRegistrations >= t.min ? t : acc), null);
  const nextBadge = tiers.find((t) => totalRegistrations < t.min) || null;
  const remainingToNext = nextBadge ? Math.max(0, nextBadge.min - totalRegistrations) : 0;

  const viewDetails = (id) => router.push(`/particularevent?id=${id}`);

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
      <header className="relative z-50 w-full px-4 sm:px-8 py-4 sm:py-6 bg-white/80 backdrop-blur-xl border-b border-[#E2E8F0]/50 shadow-lg sticky top-0">
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#1E40AF]">My Registrations</h1>
            <p className="text-[#64748B] mt-1 font-medium text-sm sm:text-base">Track your event journey and achievements</p>
          </div>
          
          {/* Back Button */}
          <button 
            onClick={() => router.back()} 
            className="absolute top-0 right-0 group relative px-4 sm:px-6 py-2.5 sm:py-3 bg-white/80 backdrop-blur-sm text-[#3B82F6] border-2 border-[#3B82F6] rounded-2xl hover:bg-[#EFF6FF] hover:border-[#1E40AF] transition-all duration-300 font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 overflow-hidden w-full sm:w-auto text-sm sm:text-base"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-[#3B82F6]/10 to-[#06B6D4]/10 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
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

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
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
              <p className="text-[#64748B] mt-6 text-lg font-medium">Loading your registered events...</p>
            </div>
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8">
            {/* Badge Journey Sidebar */}
            <aside className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* Stats Card */}
              <div className="bg-white/90 backdrop-blur-xl border border-[#E2E8F0]/50 rounded-3xl p-6 sm:p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105">
                <div className="text-center mb-4 sm:mb-6">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#3B82F6] to-[#06B6D4] rounded-3xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-2xl">
                    <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-[#1E40AF] mb-2">{totalRegistrations}</h2>
                  <p className="text-[#64748B] font-medium text-sm sm:text-base">Total Registrations</p>
                </div>
                
                {currentBadge && (
                  <div className="text-center mb-6">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl ${currentBadge.classes} border-2 shadow-lg`}>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d={currentBadge.icon} />
                      </svg>
                      <span className="font-bold">Current: {currentBadge.label}</span>
                    </div>
                  </div>
                )}
                
                {nextBadge && (
                  <div className="text-center">
                    <p className="text-[#64748B] text-sm mb-2">Next milestone</p>
                    <div className="bg-gradient-to-r from-[#3B82F6]/10 to-[#06B6D4]/10 rounded-2xl p-4 border border-[#3B82F6]/20">
                      <div className="flex items-center justify-center gap-3 mb-2">
                        <svg className="w-6 h-6 text-[#3B82F6]" fill="currentColor" viewBox="0 0 24 24">
                          <path d={nextBadge.icon} />
                        </svg>
                        <span className="font-bold text-[#1E40AF]">{nextBadge.label}</span>
                      </div>
                      <p className="text-[#64748B] text-sm">
                        Only <span className="font-bold text-[#1E40AF]">{remainingToNext}</span> more registrations!
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Badge Journey */}
              <div className="bg-white/90 backdrop-blur-xl border border-[#E2E8F0]/50 rounded-3xl p-6 shadow-xl">
                <h3 className="text-xl font-bold text-[#1E40AF] mb-4 flex items-center gap-2">
                  <svg className="w-6 h-6 text-[#3B82F6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  Badge Journey
                </h3>
                <div className="space-y-3">
                  {tiers.map((tier) => {
                    const achieved = totalRegistrations >= tier.min;
                    const isCurrent = currentBadge?.key === tier.key;
                    return (
                      <div 
                        key={tier.key} 
                        className={`relative p-4 rounded-2xl border-2 transition-all duration-300 ${
                          achieved 
                            ? 'bg-gradient-to-br from-emerald-50 to-green-100 border-emerald-200 shadow-lg' 
                            : 'bg-gray-50/50 border-gray-200'
                        } ${isCurrent ? 'ring-2 ring-[#3B82F6] ring-offset-2' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              achieved ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-500'
                            }`}>
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d={tier.icon} />
                              </svg>
                            </div>
                            <div>
                              <div className={`font-bold ${achieved ? 'text-emerald-800' : 'text-gray-600'}`}>
                                {tier.label}
                              </div>
                              <div className="text-xs text-gray-500">{tier.min}+ registrations</div>
                            </div>
                          </div>
                          {achieved && (
                            <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Achieved
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </aside>

            {/* Events Section */}
            <section className="lg:col-span-3">
              {/* Section Header */}
              <div className="mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl font-black text-[#1E40AF] mb-2">Your Events</h2>
                <p className="text-[#64748B] text-base sm:text-lg">
                  {events.length === 0 
                    ? "Start your journey by registering for events!" 
                    : `You've registered for ${events.length} amazing event${events.length === 1 ? '' : 's'}!`
                  }
                </p>
              </div>

              {/* Events List */}
              {events.length === 0 ? (
                <div className="bg-white/90 backdrop-blur-xl border border-[#E2E8F0]/50 rounded-3xl p-8 sm:p-16 text-center shadow-xl">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-[#3B82F6]/10 to-[#06B6D4]/10 rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                    <svg className="w-10 h-10 sm:w-12 sm:h-12 text-[#3B82F6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-[#1E40AF] mb-2">No Registrations Yet</h3>
                  <p className="text-[#64748B] mb-4 sm:mb-6 text-sm sm:text-base">Start building your event portfolio by registering for exciting events!</p>
                  <button 
                    onClick={() => router.push('/main/2')}
                    className="px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] text-white rounded-2xl font-semibold hover:from-[#1E40AF] hover:to-[#3B82F6] transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 text-sm sm:text-base"
                  >
                    Explore Events
                  </button>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {events.map((event, index) => (
                    <div 
                      key={event.id} 
                      className="group bg-white/90 backdrop-blur-xl border border-[#E2E8F0]/50 rounded-3xl p-4 sm:p-6 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 cursor-pointer overflow-hidden relative"
                      onClick={() => viewDetails(event.id)}
                    >
                      {/* Hover Effect Background */}
                      <div className="absolute inset-0 bg-gradient-to-r from-[#3B82F6]/5 to-[#06B6D4]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      
                      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-[#3B82F6] to-[#06B6D4] rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-lg sm:text-xl font-bold text-[#1E40AF] group-hover:text-[#3B82F6] transition-colors duration-300 mb-1">
                              {event.title || 'Untitled Event'}
                            </h3>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                              <span className="inline-flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-[#EFF6FF] text-[#3B82F6] border border-[#3B82F6]/20 font-medium text-xs sm:text-sm">
                                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {formatYmd(event.start_date || event.date)}
                              </span>
                              <span className="text-[#64748B] text-xs sm:text-sm">Event #{index + 1}</span>
                            </div>
                          </div>
                        </div>
                        
                        <button 
                          onClick={(ev) => { ev.stopPropagation(); viewDetails(event.id); }}
                          className="group/btn relative px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] text-white rounded-2xl font-semibold hover:from-[#1E40AF] hover:to-[#3B82F6] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 overflow-hidden w-full sm:w-auto text-sm sm:text-base"
                        >
                          <span className="relative z-10 flex items-center justify-center gap-2">
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            View Details
                          </span>
                          <div className="absolute inset-0 bg-gradient-to-r from-[#06B6D4] to-[#3B82F6] opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}


