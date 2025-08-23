'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ParticipantWishlistPage() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    const fetchWishlistedEvents = async () => {
      try {
        setLoading(true);
        setError('');
        
        const userId = localStorage.getItem('userId');
        if (!userId) {
          setError('Please log in to view your wishlist');
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/participants/wishlisted-events?user_id=${userId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch wishlisted events');
        }
        
        const data = await response.json();
        if (data.success) {
          setEvents(data.events || []);
        } else {
          throw new Error(data.error || 'Failed to fetch events');
        }
      } catch (err) {
        console.error('Error fetching wishlisted events:', err);
        setError(err.message || 'Failed to load wishlisted events');
      } finally {
        setLoading(false);
      }
    };

    fetchWishlistedEvents();
  }, []);

  const formatYmd = (ymd) => {
    if (!ymd) return '-';
    const [y, m, d] = String(ymd).split('-').map(Number);
    const date = new Date(y, (m || 1) - 1, d || 1);
    if (Number.isNaN(date.getTime())) return String(ymd);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const tiers = [
    { key: 'bronze', label: 'Bronze', min: 5, classes: 'bg-amber-50 text-amber-800 border-amber-300', cardBg: 'from-amber-50 to-orange-100', iconText: 'text-amber-800' },
    { key: 'silver', label: 'Silver', min: 10, classes: 'bg-zinc-50 text-zinc-700 border-zinc-200', cardBg: 'from-zinc-50 to-zinc-100', iconText: 'text-zinc-700' },
    { key: 'gold', label: 'Gold', min: 20, classes: 'bg-yellow-50 text-yellow-700 border-yellow-300', cardBg: 'from-yellow-50 to-yellow-200', iconText: 'text-yellow-700' },
    { key: 'platinum', label: 'Platinum', min: 40, classes: 'bg-purple-50 text-purple-700 border-purple-200', cardBg: 'from-purple-50 to-purple-100', iconText: 'text-purple-700' }
  ];
  const totalSaved = events.length;
  const currentBadge = tiers.reduce((acc, t) => (totalSaved >= t.min ? t : acc), null);
  const nextBadge = tiers.find((t) => totalSaved < t.min) || null;
  const remainingToNext = nextBadge ? Math.max(0, nextBadge.min - totalSaved) : 0;

  const viewDetails = (id) => router.push(`/particularevent?id=${id}`);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  const removeFromWishlist = async (eventId) => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        setError('Please log in to manage your wishlist');
        return;
      }

      const response = await fetch('/api/wishlist/remove', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_id: eventId,
          user_id: userId
        })
      });

      if (response.ok) {
        // Remove from local state
        setEvents(prev => prev.filter(event => event.id !== eventId));
        
        // Update localStorage
        const wishRaw = localStorage.getItem('wishlist_event_ids');
        if (wishRaw) {
          const wishlist = JSON.parse(wishRaw);
          const updatedWishlist = wishlist.filter(id => id !== eventId);
          localStorage.setItem('wishlist_event_ids', JSON.stringify(updatedWishlist));
        }
        
        showToast('Event removed from wishlist successfully!');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to remove from wishlist');
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      setError('Failed to remove from wishlist. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">{toast}</span>
          </div>
        </div>
      )}

      <header className="w-full px-6 py-6 bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">My Wishlist</h1>
            <p className="text-gray-600 mt-2">Events you are interested in</p>
          </div>
          <button onClick={() => router.back()} className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50">Back</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
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

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your wishlist...</p>
            </div>
          </div>
        )}

        {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <aside className="md:col-span-2">
            <div className="bg-white/90 backdrop-blur-sm border border-gray-200/60 rounded-2xl p-6 shadow-sm sticky top-4">
              <h2 className="text-sm font-semibold text-gray-900">Badge Journey</h2>
              <p className="text-xs text-gray-700 mt-1">Save events to stay motivated and level up.</p>
              <div className="mt-4 space-y-3">
                {tiers.map((t) => {
                  const achieved = totalSaved >= t.min;
                  const isCurrent = currentBadge?.key === t.key;
                  return (
                    <div key={t.key} className={`rounded-2xl border shadow-md p-4 md:p-5 bg-gradient-to-br ${t.cardBg} ${achieved ? '' : 'opacity-80'} ${isCurrent ? 'ring-2 ring-purple-300' : ''} min-h-[92px]`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/80 border border-white/60 ${t.iconText}`}>
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M12 2l2.39 4.84 5.34.78-3.86 3.76.91 5.32L12 14.77 6.22 16.7l.91-5.32L3.27 7.62l5.34-.78L12 2z" />
                            </svg>
                          </span>
                          <div>
                            <div className={`text-base font-bold ${t.iconText}`}>{t.label}</div>
                            <div className="text-xs text-gray-700">{t.min}+ saved</div>
                          </div>
                        </div>
                        {achieved && (
                          <span className="inline-flex items-center gap-1.5 text-[11px] md:text-xs px-2.5 py-1.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                            Achieved
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>

          <section className="md:col-span-3">
            <div className="mb-6 bg-white/90 backdrop-blur-sm border border-gray-200/60 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Saved Events</h2>
                  <p className="text-xs text-gray-700">
                    You have <span className="font-semibold text-gray-900">{totalSaved}</span> saved event{totalSaved === 1 ? '' : 's'}.
                    {nextBadge ? (
                      <> {' '}Only <span className="font-semibold text-gray-900">{remainingToNext}</span> more for <span className="font-semibold">{nextBadge.label}</span>!</>
                    ) : (
                      <> Keep going — you&apos;re at the top tier!</>
                    )}
                  </p>
                </div>
                {currentBadge && (
                  <span className={`inline-flex items-center gap-2 text-xs border px-3 py-1.5 rounded-full ${currentBadge.classes}`} title={`Current badge: ${currentBadge.label}`}>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 2l2.39 4.84 5.34.78-3.86 3.76.91 5.32L12 14.77 6.22 16.7l.91-5.32L3.27 7.62l5.34-.78L12 2z" />
                    </svg>
                    Current: {currentBadge.label}
                  </span>
                )}
              </div>
            </div>

            {events.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200/60 p-10 text-center text-gray-900">No items in wishlist.</div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200/60 overflow-x-auto shadow-md">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50/80">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Title</th>
                      <th scope="col" className="px-6 py-3 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                      <th scope="col" className="px-6 py-3 text-right text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {events.map((e) => (
                      <tr key={e.id} className="odd:bg-white even:bg-gray-50 hover:bg-indigo-50/50 transition-colors cursor-pointer" onClick={() => viewDetails(e.id)}>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          <div className="flex items-center gap-3">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
                            </span>
                            <span className="truncate max-w-[28ch]">{e.title || 'Untitled Event'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-700">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                            {formatYmd(e.start_date || e.date)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center gap-2 justify-end">
                          <button onClick={(ev) => { ev.stopPropagation(); viewDetails(e.id); }} className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:from-blue-700 hover:to-purple-700">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            View
                          </button>
                            <button 
                              onClick={(ev) => { 
                                ev.stopPropagation(); 
                                removeFromWishlist(e.id); 
                              }} 
                              className="inline-flex items-center gap-1.5 bg-red-600 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-red-700"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
        )}
      </main>
    </div>
  );
}


