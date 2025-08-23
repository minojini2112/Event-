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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="w-full px-6 py-6 bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              My Posted Events
            </h1>
            <p className="text-gray-600 mt-2">You have posted {totalPosted} {totalPosted === 1 ? 'event' : 'events'}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => router.push('/main/1')} className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50">
              Go to Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {postedEvents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200/60 p-10 text-center text-gray-900">
            No posted events yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {postedEvents.map((event) => (
              <div key={event.event_id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border border-gray-200/50 overflow-hidden">
                <div className="relative h-40 bg-gradient-to-br from-blue-100 to-purple-100 overflow-hidden">
                  <div className="absolute bottom-2 right-2 bg-black/20 text-white text-xs px-2 py-1 rounded">Posted</div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 text-lg mb-1 line-clamp-2">{event.event_name}</h3>
                  <div className="flex items-center text-gray-900 mb-2">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm">{event.start_date || '-'}</span>
                  </div>
                  <p className="text-gray-900 text-sm line-clamp-3">{event.description || '-'}</p>
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => {
                        try {
                          if (typeof window !== 'undefined') {
                            window.localStorage.setItem('selected_event', JSON.stringify(event));
                          }
                        } catch {}
                        router.push(`/particularevent?id=${event.event_id}`);
                      }}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      View More
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


