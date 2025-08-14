'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ParticipantRegisteredPage() {
  const router = useRouter();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    // Dummy data: replace with real data source later
    const dummy = [
      { id: '1', title: 'Tech Conference 2024', start_date: '2024-03-15' },
      { id: '2', title: 'AI Workshop', start_date: '2024-04-02' },
      { id: '3', title: 'Hackathon Night', start_date: '2024-05-20' }
    ];
    setEvents(dummy);
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
  const totalRegistrations = events.length;
  const currentBadge = tiers.reduce((acc, t) => (totalRegistrations >= t.min ? t : acc), null);
  const nextBadge = tiers.find((t) => totalRegistrations < t.min) || null;
  const remainingToNext = nextBadge ? Math.max(0, nextBadge.min - totalRegistrations) : 0;

  const viewDetails = (id) => router.push(`/particularevent?id=${id}`);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="w-full px-6 py-6 bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">My Registrations</h1>
            <p className="text-gray-600 mt-2">All events you have registered for</p>
          </div>
          <button onClick={() => router.back()} className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50">Back</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <aside className="md:col-span-2">
            <div className="bg-white/90 backdrop-blur-sm border border-gray-200/60 rounded-2xl p-6 shadow-sm sticky top-4">
              <h2 className="text-sm font-semibold text-gray-900">Badge Journey</h2>
              <p className="text-xs text-gray-700 mt-1">Earn badges by registering for more events.</p>
              <div className="mt-4 space-y-3">
                {tiers.map((t) => {
                  const achieved = totalRegistrations >= t.min;
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
                            <div className="text-xs text-gray-700">{t.min}+ registrations</div>
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
                  <h2 className="text-base font-semibold text-gray-900">Achievements</h2>
                  <p className="text-xs text-gray-700">
                    You have <span className="font-semibold text-gray-900">{totalRegistrations}</span> registration{totalRegistrations === 1 ? '' : 's'}.
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
          <div className="bg-white rounded-2xl border border-gray-200/60 p-10 text-center text-gray-900">No registrations yet.</div>
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
                      <button onClick={(ev) => { ev.stopPropagation(); viewDetails(e.id); }} className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:from-blue-700 hover:to-purple-700">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
          </section>
        </div>
      </main>
    </div>
  );
}


