'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPostedEventsPage() {
  const router = useRouter();
  const [postedEvents, setPostedEvents] = useState([]);
  const [selected, setSelected] = useState(null); // event for View More modal

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const stored = window.localStorage.getItem('posted_events');
      const list = stored ? JSON.parse(stored) : [];
      if (Array.isArray(list)) setPostedEvents(list);
    } catch (e) {
      console.error('Failed to load posted events:', e);
    }
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
            <button onClick={() => router.push('/admin/addnewevent')} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-purple-700">
              Add New Event
            </button>
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
              <div key={event.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border border-gray-200/50 overflow-hidden">
                <div className="relative h-40 bg-gradient-to-br from-blue-100 to-purple-100 overflow-hidden">
                  <div className="absolute bottom-2 right-2 bg-black/20 text-white text-xs px-2 py-1 rounded">Posted</div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 text-lg mb-1 line-clamp-2">{event.title}</h3>
                  <div className="flex items-center text-gray-900 mb-2">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm">{event.date}</span>
                  </div>
                  <p className="text-gray-900 text-sm line-clamp-3">{event.description || '-'}</p>
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => setSelected(event)}
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

      {/* View More Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">{selected.title}</h2>
              <button onClick={() => setSelected(null)} className="text-gray-600 hover:text-gray-900">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="text-xs text-gray-600">Start Date</div>
                <div className="text-sm font-medium text-gray-900">{selected.start_date || '-'}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="text-xs text-gray-600">End Date</div>
                <div className="text-sm font-medium text-gray-900">{selected.end_date || '-'}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 md:col-span-2">
                <div className="text-xs text-gray-600">Description</div>
                <div className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{selected.description || '-'}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 md:col-span-2">
                <div className="text-xs text-gray-600">Total Participants Allowed</div>
                <div className="text-sm font-medium text-gray-900">{selected.total_participants_allowed || '-'}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 md:col-span-2">
                <div className="text-xs text-gray-600">Student Coordinators</div>
                <ul className="mt-1 text-sm text-gray-900 list-disc list-inside">
                  {(selected.student_coordinators || []).filter(c => c.name || c.phone).map((c, i) => (
                    <li key={i}>{c.name} {c.phone && `• ${c.phone}`}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 md:col-span-2">
                <div className="text-xs text-gray-600">Staff Incharge</div>
                <ul className="mt-1 text-sm text-gray-900 list-disc list-inside">
                  {(selected.staff_incharge || []).filter(s => s.name || s.department).map((s, i) => (
                    <li key={i}>{s.name} {s.department && `• ${s.department}`}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
              <button onClick={() => setSelected(null)} className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


