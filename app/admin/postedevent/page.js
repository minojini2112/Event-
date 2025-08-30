'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPostedEventsPage() {
  const router = useRouter();
  const [postedEvents, setPostedEvents] = useState([]);

  useEffect(() => {
    const fetchMyEvents = async () => {
      try {
        const adminId = typeof window !== 'undefined' ? window.localStorage.getItem('userId') : null;
        if (!adminId) return;
        const res = await fetch(`/api/events?adminId=${adminId}`);
        const json = await res.json();
        if (res.ok) {
          setPostedEvents(json.events || []);
        } else {
          console.error('Failed to fetch admin events:', json.error);
        }
      } catch (e) {
        console.error('Failed to load posted events:', e);
      }
    };
    fetchMyEvents();
  }, []);

  const totalPosted = useMemo(() => postedEvents.length, [postedEvents]);

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

      {/* Modern Header */}
      <header className="relative z-50 w-full px-8 py-8 bg-white/80 backdrop-blur-xl border-b border-[#E2E8F0]/50 shadow-lg sticky top-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-black bg-gradient-to-r from-[#3B82F6] to-[#1E40AF] bg-clip-text text-transparent tracking-tight">
                My Posted Events
              </h1>
              <p className="text-[#64748B] text-lg font-medium">
                {totalPosted === 0 ? 'No events posted yet' : `${totalPosted} ${totalPosted === 1 ? 'event' : 'events'} posted`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push('/main/1')} 
              className="group relative px-6 py-3 text-[#3B82F6] border-2 border-[#3B82F6] rounded-2xl hover:bg-[#EFF6FF] hover:border-[#1E40AF] transition-all duration-300 font-semibold bg-white/80 backdrop-blur-sm overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Go to Dashboard
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#3B82F6]/10 to-[#06B6D4]/10 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-8 py-12">
        {postedEvents.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-[#E2E8F0]/50 p-16 text-center shadow-xl relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-r from-[#3B82F6]/5 to-[#06B6D4]/5 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-r from-[#06B6D4]/5 to-[#3B82F6]/5 rounded-full translate-y-12 -translate-x-12"></div>
            
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-[#3B82F6]/10 to-[#06B6D4]/10 rounded-full flex items-center justify-center border border-[#E2E8F0]/50">
              <svg className="w-12 h-12 text-[#3B82F6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-3xl font-black bg-gradient-to-r from-[#3B82F6] to-[#1E40AF] bg-clip-text text-transparent mb-3">No events posted yet</h3>
            <p className="text-[#64748B] text-lg font-medium">Start creating your first event to see it here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {postedEvents.map((event) => (
              <div 
                key={event.event_id} 
                className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 border border-[#E2E8F0]/30 overflow-hidden group relative z-10 hover:border-[#3B82F6]/50"
              >
                {/* Event Image/Header Section */}
                <div className="relative h-52 bg-gradient-to-br from-[#1E40AF] via-[#3B82F6] to-[#06B6D4] overflow-hidden">
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
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-[#3B82F6] text-xs font-semibold px-4 py-2 rounded-2xl shadow-lg border border-white/30">
                    Posted
                  </div>
                  {/* Decorative Elements */}
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#3B82F6] to-[#06B6D4]"></div>
                  <div className="absolute bottom-4 left-4 w-8 h-8 bg-white/10 rounded-full border border-white/20"></div>
                  <div className="absolute top-1/2 right-8 w-6 h-6 bg-white/10 rounded-full border border-white/20"></div>
                </div>

                {/* Event Content */}
                <div className="p-6 space-y-4">
                  <div className="space-y-3">
                    <h3 className="font-bold text-[#1E40AF] text-xl leading-tight line-clamp-2 group-hover:text-[#3B82F6] transition-colors duration-300">
                      {event.event_name}
                    </h3>
                    
                    <div className="flex items-center text-[#64748B]">
                      <div className="w-6 h-6 bg-[#3B82F6]/10 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-3 h-3 text-[#3B82F6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium">{event.start_date || 'Date not set'}</span>
                    </div>
                  </div>

                  <p className="text-[#334155] text-sm leading-relaxed line-clamp-3">
                    {event.description || 'No description available'}
                  </p>

                  {/* Action Button */}
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        try {
                          if (typeof window !== 'undefined') {
                            window.localStorage.setItem('selected_event', JSON.stringify(event));
                          }
                        } catch {}
                        router.push(`/particularevent?id=${event.event_id}`);
                      }}
                      className="group relative w-full bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] text-white px-6 py-3 rounded-2xl text-sm font-semibold hover:from-[#1E40AF] hover:to-[#3B82F6] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-[0.98] overflow-hidden"
                    >
                      <span className="relative z-10">View Details</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-[#06B6D4] to-[#3B82F6] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}