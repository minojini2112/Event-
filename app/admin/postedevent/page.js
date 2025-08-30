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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Modern Header */}
      <header className="w-full px-6 py-8 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-semibold text-slate-800 tracking-tight">
              My Posted Events
            </h1>
            <p className="text-slate-600 text-lg font-medium">
              {totalPosted === 0 ? 'No events posted yet' : `${totalPosted} ${totalPosted === 1 ? 'event' : 'events'} posted`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push('/main/1')} 
              className="px-6 py-3 rounded-lg text-sm font-semibold border-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {postedEvents.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-16 text-center shadow-sm">
            <div className="w-20 h-20 mx-auto mb-6 bg-slate-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-slate-800 mb-3">No events posted yet</h3>
            <p className="text-slate-600 text-lg">Start creating your first event to see it here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {postedEvents.map((event) => (
              <div 
                key={event.event_id} 
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] border border-slate-200 overflow-hidden group"
              >
                {/* Event Image/Header Section */}
                <div className="relative h-48 bg-gradient-to-br from-blue-100 via-cyan-50 to-blue-200 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
                    Posted
                  </div>
                  {/* Decorative Elements */}
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-400"></div>
                </div>

                {/* Event Content */}
                <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-slate-800 text-xl leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
                      {event.event_name}
                    </h3>
                    
                    <div className="flex items-center text-slate-600">
                      <svg className="w-4 h-4 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm font-medium">{event.start_date || 'Date not set'}</span>
                    </div>
                  </div>

                  <p className="text-slate-600 text-sm leading-relaxed line-clamp-3">
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
                      className="w-full bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-6 py-3 rounded-lg text-sm font-semibold hover:from-blue-600 hover:to-cyan-500 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      View Details
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